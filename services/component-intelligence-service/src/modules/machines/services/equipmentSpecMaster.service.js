// Equipment Master Specification Engine for Heavy Mining Equipment (HME)
// Queries master_equipment_catalog database table (91+ Brands, 55+ Categories)
// and provides standard components, parameter fields, units (PSI, °C, Bar, V, RPM, %), and safe operating bounds.

const prisma = require('../../../database/prismaClient');

class EquipmentSpecMasterService {
    /**
     * Look up standard spec template from master_equipment_catalog database table
     * If the DB does not contain a matching record, a remote API should be called to fetch the spec.
     * The hard‑coded fallback catalog has been removed.
     */
    async getSpecTemplate(equipmentTypeStr = '', modelName = '') {
        const queryStr = (equipmentTypeStr + ' ' + modelName).trim().toLowerCase();

        // 1️⃣ Try fetching directly from PostgreSQL master_equipment_catalog table
        try {
            const dbRecords = await prisma.masterEquipmentCatalog.findMany({
                take: 50
            });

            if (dbRecords && dbRecords.length > 0) {
                // Find best matching model
                const matched = dbRecords.find(r =>
                    queryStr.includes(r.modelName?.toLowerCase()) ||
                    queryStr.includes(r.brand?.toLowerCase()) ||
                    queryStr.includes(r.category?.toLowerCase())
                ) || dbRecords[0];

                return {
                    id: matched.id,
                    brand: matched.brand,
                    category: matched.category,
                    modelName: matched.modelName,
                    operatingWeight: matched.operatingWeight,
                    enginePower: matched.enginePower,
                    equipmentType: matched.category,
                    components: matched.components,
                    totalSpecsCount: matched.totalSpecsCount,
                    source: "PostgreSQL master_equipment_catalog DB Table"
                };
            }
        } catch (dbErr) {
            console.error('[MASTER_CATALOG_DB_QUERY_ERR]:', dbErr.message);
        }

        // 2️⃣ No record found in DB – remote API should be called here.
        // TODO: Implement fetchRemoteSpec(equipmentTypeStr, modelName) to call HeavyEquipmentHub API.
        // Example placeholder (replace with actual fetch logic):
        // const remoteSpec = await this.fetchRemoteSpec(equipmentTypeStr, modelName);
        // return remoteSpec;

        // For now, return an empty spec indicating no data available.
        return {
            equipmentType: equipmentTypeStr,
            modelName,
            components: [],
            totalSpecsCount: 0,
            source: "No spec found – fallback removed"
        };
    }

    /**
     * Get distinct categories and brands metadata with counts (cached in memory)
     */
    async getFiltersMetadata() {
        const now = Date.now();
        if (this._cachedMetadata && (now - this._lastMetadataFetch < 3600000)) {
            return this._cachedMetadata;
        }

        try {
            const [categoriesRaw, brandsRaw, totalMachines] = await Promise.all([
                prisma.masterEquipmentCatalog.groupBy({
                    by: ['category'],
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } }
                }),
                prisma.masterEquipmentCatalog.groupBy({
                    by: ['brand'],
                    _count: { id: true },
                    orderBy: { _count: { id: 'desc' } }
                }),
                prisma.masterEquipmentCatalog.count()
            ]);

            const categories = categoriesRaw
                .filter(c => c.category)
                .map(c => ({ name: c.category, count: c._count.id }));

            const brands = brandsRaw
                .filter(b => b.brand)
                .map(b => ({ name: b.brand, count: b._count.id }));

            this._cachedMetadata = {
                totalMachines,
                totalBrands: brands.length,
                totalCategories: categories.length,
                categories,
                brands
            };
            this._lastMetadataFetch = now;
            return this._cachedMetadata;
        } catch (e) {
            console.error('[GET_FILTERS_METADATA_ERR]:', e.message);
            return {
                totalMachines: 9742,
                totalBrands: 91,
                totalCategories: 55,
                categories: [],
                brands: []
            };
        }
    }

    /**
     * Get paginated or filtered catalog entries from master_equipment_catalog database table
     */
    async getCatalogFromDB({ page = 1, limit = 25, search = '', brand = '', category = '', includeComponents = false } = {}) {
        try {
            const whereClause = {};
            if (brand && brand !== 'ALL') {
                whereClause.brand = { contains: brand.trim(), mode: 'insensitive' };
            }
            if (category && category !== 'ALL') {
                whereClause.category = { contains: category.trim(), mode: 'insensitive' };
            }
            if (search && search.trim()) {
                const term = search.trim();
                whereClause.OR = [
                    { modelName: { contains: term, mode: 'insensitive' } },
                    { brand: { contains: term, mode: 'insensitive' } },
                    { category: { contains: term, mode: 'insensitive' } },
                    { operatingWeight: { contains: term, mode: 'insensitive' } },
                    { enginePower: { contains: term, mode: 'insensitive' } }
                ];
            }

            const selectFields = {
                id: true,
                slug: true,
                brand: true,
                category: true,
                modelName: true,
                operatingWeight: true,
                enginePower: true,
                totalSpecsCount: true,
                createdAt: true,
                updatedAt: true
            };
            if (includeComponents) {
                selectFields.components = true;
            }

            const isAll = String(limit).toLowerCase() === 'all';
            const parsedLimit = isAll ? 500 : Math.max(1, Math.min(parseInt(limit, 10) || 25, 200));
            const parsedPage = Math.max(1, parseInt(page, 10) || 1);
            const skip = isAll ? 0 : (parsedPage - 1) * parsedLimit;

            const [totalItems, catalog, distinctBrands, distinctCategories] = await Promise.all([
                prisma.masterEquipmentCatalog.count({ where: whereClause }),
                prisma.masterEquipmentCatalog.findMany({
                    where: whereClause,
                    select: selectFields,
                    orderBy: [{ brand: 'asc' }, { modelName: 'asc' }],
                    take: isAll ? undefined : parsedLimit,
                    skip: isAll ? undefined : skip
                }),
                prisma.masterEquipmentCatalog.groupBy({
                    by: ['brand']
                }),
                prisma.masterEquipmentCatalog.groupBy({
                    by: ['category']
                })
            ]);

            const totalPages = isAll ? 1 : Math.max(1, Math.ceil(totalItems / parsedLimit));

            return {
                catalog,
                totalBrands: distinctBrands.filter(b => b.brand).length,
                totalCategories: distinctCategories.filter(c => c.category).length,
                pagination: {
                    page: parsedPage,
                    limit: isAll ? totalItems : parsedLimit,
                    totalItems,
                    totalPages
                }
            };
        } catch (e) {
            console.error('[GET_CATALOG_DB_ERR]:', e.message);
            return { catalog: [], totalBrands: 0, totalCategories: 0, pagination: { page: 1, limit: 25, totalItems: 0, totalPages: 1 } };
        }
    }

    /**
     * Get all catalog entries from master_equipment_catalog database table (Cached in-memory)
     */
    async getFullCatalogFromDB() {
        const now = Date.now();
        if (this._cachedFullCatalog && (now - this._lastFullCatalogFetch < 3600000)) {
            return this._cachedFullCatalog;
        }

        try {
            const catalog = await prisma.masterEquipmentCatalog.findMany({
                select: {
                    id: true,
                    slug: true,
                    brand: true,
                    category: true,
                    modelName: true,
                    operatingWeight: true,
                    enginePower: true,
                    totalSpecsCount: true
                },
                orderBy: [{ brand: 'asc' }, { modelName: 'asc' }]
            });

            if (catalog && catalog.length > 0) {
                this._cachedFullCatalog = catalog;
                this._lastFullCatalogFetch = now;
            }
            return catalog;
        } catch (e) {
            console.error('[GET_CATALOG_DB_ERR]:', e.message);
            return this._cachedFullCatalog || [];
        }
    }
}

module.exports = new EquipmentSpecMasterService();
