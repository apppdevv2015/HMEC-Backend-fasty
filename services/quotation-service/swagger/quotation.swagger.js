/**
 * @swagger
 * tags:
 *   - name: Quotation
 *     description: Comprehensive Quotation Request, Official Proposal Generation, Review, and Digital Signature Contract Lifecycle
 *   - name: Quotation - Optional Services
 *     description: Value-Added and Optional Integrations Catalogue Management (Telematics, ERP, Reports, Migration, Training, Support)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OptionalServiceCatalog:
 *       type: object
 *       description: Value-added / Optional Service definition in the platform catalog
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "8f7e6d5c-4b3a-2109-8765-43210fedcba9"
 *         code:
 *           type: string
 *           example: "telematics"
 *           description: Unique slug identifier for the service
 *         name:
 *           type: string
 *           example: "Telematics / ECU Integration"
 *           description: Human-readable service name
 *         category:
 *           type: string
 *           enum: [Integration, Analytics, Support, Data, Training]
 *           example: "Integration"
 *         description:
 *           type: string
 *           example: "Direct CAN-bus, IoT telematics gateway, and OEM electronic control unit integration for real-time telemetry streaming."
 *         pricingType:
 *           type: string
 *           enum: [included, as_per_requirement, fixed_price, per_machine, monthly]
 *           example: "as_per_requirement"
 *         defaultPrice:
 *           type: number
 *           format: float
 *           example: 2500.00
 *           description: Base or suggested price in USD / ZAR
 *         unit:
 *           type: string
 *           example: "per machine setup"
 *           description: Billing metric or scope specification
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "Real-time CAN-bus engine parameter streaming"
 *             - "Automated fault code (DTC) ingestion"
 *             - "GPS geofencing & operational route mapping"
 *         isActive:
 *           type: boolean
 *           example: true
 *         sortOrder:
 *           type: integer
 *           example: 1
 *         createdBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-26T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-08-26T10:00:00.000Z"
 *
 *     OptionalServiceInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: "SAP / ERP Integration"
 *         code:
 *           type: string
 *           example: "erp"
 *         category:
 *           type: string
 *           example: "Integration"
 *         description:
 *           type: string
 *           example: "Seamless bidirectional synchronization with corporate ERP, SAP S/4HANA, and Oracle EAM."
 *         pricingType:
 *           type: string
 *           example: "as_per_requirement"
 *         defaultPrice:
 *           type: number
 *           example: 4500.00
 *         unit:
 *           type: string
 *           example: "one-time enterprise connector"
 *         features:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "Automated purchase order & spare parts requisition"
 *             - "Work order sync with SAP Maintenance module"
 *         sortOrder:
 *           type: integer
 *           example: 2
 *         isActive:
 *           type: boolean
 *           example: true
 *
 *     Quotation:
 *       type: object
 *       description: Complete quotation record tracking proposal, amounts, selected optional services, and contract state
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         quotationNumber:
 *           type: string
 *           example: "QT-2026-0001"
 *         companyId:
 *           type: string
 *           format: uuid
 *           example: "c4b3a210-9876-5432-10fe-dcba98765432"
 *         companyName:
 *           type: string
 *           example: "African Mining & Infrastructure Ltd"
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 *         contactEmail:
 *           type: string
 *           format: email
 *           example: "johndoe@miningcorp.com"
 *         contactPhone:
 *           type: string
 *           example: "+27 11 555 0192"
 *         status:
 *           type: string
 *           enum: [DRAFT, PENDING_REVIEW, SENT, ACCEPTED, REJECTED, EXPIRED, CONTRACT_GENERATED]
 *           example: "SENT"
 *         tier:
 *           type: string
 *           example: "Enterprise"
 *         machineCount:
 *           type: integer
 *           example: 25
 *         contractDuration:
 *           type: string
 *           example: "12"
 *           description: Duration in months ("12", "24", "36")
 *         billingFrequency:
 *           type: string
 *           example: "Monthly in Advance"
 *         baseAmount:
 *           type: number
 *           format: float
 *           example: 37500.00
 *         optionalServicesAmount:
 *           type: number
 *           format: float
 *           example: 7000.00
 *         discountAmount:
 *           type: number
 *           format: float
 *           example: 2500.00
 *         taxAmount:
 *           type: number
 *           format: float
 *           example: 0.00
 *         totalAmount:
 *           type: number
 *           format: float
 *           example: 42000.00
 *         optionalServices:
 *           type: array
 *           description: Snapshot of selected optional services included with pricing
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               price:
 *                 type: number
 *               pricingType:
 *                 type: string
 *           example:
 *             - id: "8f7e6d5c-4b3a-2109-8765-43210fedcba9"
 *               code: "telematics"
 *               name: "Telematics / ECU Integration"
 *               price: 2500.00
 *             - id: "7a6b5c4d-3e2f-1098-7654-3210fedcba98"
 *               code: "erp"
 *               name: "SAP / ERP Integration"
 *               price: 4500.00
 *         paymentTerms:
 *           type: string
 *           example: "Net 30 Days"
 *         notes:
 *           type: string
 *           example: "Official enterprise fleet diagnostic and AI intelligence subscription proposal."
 *         validUntil:
 *           type: string
 *           format: date-time
 *           example: "2026-09-25T23:59:59.000Z"
 *         sentAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         signedBy:
 *           type: string
 *           nullable: true
 *           example: "John Doe (Managing Director)"
 *         signatureUrl:
 *           type: string
 *           nullable: true
 *           example: "data:image/png;base64,iVBORw0KGgo..."
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     QuotationInquiry:
 *       type: object
 *       description: Inbound Quotation Request / Inquiry from Client
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         inquiryId:
 *           type: string
 *           example: "QIN-00001"
 *         companyId:
 *           type: string
 *         companyName:
 *           type: string
 *           example: "ABC Mining Pvt Ltd"
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john.doe@abcmining.com"
 *         phone:
 *           type: string
 *           example: "+91 98765 43210"
 *         siteLocation:
 *           type: string
 *           example: "Nagpur, Maharashtra"
 *         quotationType:
 *           type: string
 *           enum: ["Fleet Management", "Predictive Maintenance", "Asset Monitoring"]
 *           example: "Predictive Maintenance"
 *         numberOfSites:
 *           type: integer
 *           example: 2
 *         siteNames:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Nagpur Site 1", "Chandrapur Pit 2"]
 *         activeMachines:
 *           type: integer
 *           example: 25
 *         equipmentTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Excavator", "Dump Truck", "Dozer"]
 *         contractDuration:
 *           type: string
 *           enum: ["6 Months", "12 Months", "18 Months", "24 Months"]
 *           example: "12 Months"
 *         implementationRequirements:
 *           type: string
 *           example: "Deploy telematics units across all active machines within 2 weeks of signing."
 *         additionalRequirements:
 *           type: string
 *           example: "Require on-site technical training for 5 artisans."
 *         attachmentUrl:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *           example: "ACTIVE"
 *         quotationStatus:
 *           type: string
 *           nullable: true
 *           enum: [DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED]
 *           example: null
 *
 *     QuotationInquiryInput:
 *       type: object
 *       required:
 *         - email
 *         - quotationType
 *         - numberOfSites
 *         - activeMachines
 *       properties:
 *         companyName:
 *           type: string
 *           example: "ABC Mining Pvt Ltd"
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           example: "john.doe@abcmining.com"
 *         phone:
 *           type: string
 *           example: "+91 98765 43210"
 *         siteLocation:
 *           type: string
 *           example: "Nagpur, Maharashtra"
 *         quotationType:
 *           type: string
 *           example: "Predictive Maintenance"
 *         numberOfSites:
 *           type: integer
 *           example: 2
 *         siteNames:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Nagpur Site 1", "Chandrapur Pit 2"]
 *         activeMachines:
 *           type: integer
 *           example: 25
 *         equipmentTypes:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Excavator", "Dump Truck"]
 *         contractDuration:
 *           type: string
 *           example: "12 Months"
 *         implementationRequirements:
 *           type: string
 *           example: "Deploy telematics units across all active machines."
 *         additionalRequirements:
 *           type: string
 *           example: "Special on-site engineer support."
 *         attachmentUrl:
 *           type: string
 *           example: "https://storage.googleapis.com/hme/specs.pdf"
 *
 *     QuotationRequestInput:
 *       type: object
 *       required:
 *         - companyName
 *         - contactEmail
 *       properties:
 *         companyId:
 *           type: string
 *           format: uuid
 *         companyName:
 *           type: string
 *           example: "African Mining & Infrastructure Ltd"
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 *         contactEmail:
 *           type: string
 *           example: "johndoe@miningcorp.com"
 *         contactPhone:
 *           type: string
 *           example: "+27 11 555 0192"
 *         tier:
 *           type: string
 *           example: "Enterprise"
 *         machineCount:
 *           type: integer
 *           example: 25
 *         contractDuration:
 *           type: string
 *           example: "12"
 *         billingFrequency:
 *           type: string
 *           example: "Monthly in Advance"
 *         optionalServices:
 *           type: array
 *           items:
 *             type: string
 *           example:
 *             - "telematics"
 *             - "erp"
 *             - "reports"
 *         notes:
 *           type: string
 *           example: "Need expedited deployment for our Northern Cape open-pit fleet."
 *
 *     QuotationSendInput:
 *       type: object
 *       required:
 *         - companyId
 *         - companyName
 *         - contactEmail
 *         - baseAmount
 *         - totalAmount
 *       properties:
 *         quotationNumber:
 *           type: string
 *           example: "QT-2026-0001"
 *         companyId:
 *           type: string
 *           format: uuid
 *         companyName:
 *           type: string
 *           example: "African Mining & Infrastructure Ltd"
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 *         contactEmail:
 *           type: string
 *           example: "johndoe@miningcorp.com"
 *         contactPhone:
 *           type: string
 *           example: "+27 11 555 0192"
 *         tier:
 *           type: string
 *           example: "Enterprise"
 *         machineCount:
 *           type: integer
 *           example: 25
 *         contractDuration:
 *           type: string
 *           example: "12"
 *         billingFrequency:
 *           type: string
 *           example: "Monthly in Advance"
 *         baseAmount:
 *           type: number
 *           example: 37500.00
 *         optionalServicesAmount:
 *           type: number
 *           example: 7000.00
 *         discountAmount:
 *           type: number
 *           example: 2500.00
 *         totalAmount:
 *           type: number
 *           example: 42000.00
 *         optionalServices:
 *           type: array
 *           items:
 *             type: object
 *         paymentTerms:
 *           type: string
 *           example: "Monthly in Advance via EFT / Direct Debit"
 *         notes:
 *           type: string
 *           example: "Includes 24/7 dedicated support engineer SLA."
 *         validUntil:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /optional-services:
 *   get:
 *     summary: List all active optional services
 *     description: Public and client-facing catalogue of active value-added optional services for quotation building.
 *     tags: [Quotation - Optional Services]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (e.g. Integration, Analytics, Support, Data, Training)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Keyword search on service name or description
 *     responses:
 *       200:
 *         description: List of active optional services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OptionalServiceCatalog'
 *
 *   post:
 *     summary: Super Admin - Create new optional service
 *     tags: [Quotation - Optional Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OptionalServiceInput'
 *     responses:
 *       201:
 *         description: Service created successfully
 *
 * /optional-services/{id}:
 *   get:
 *     summary: Get single optional service details
 *     tags: [Quotation - Optional Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service UUID or Code
 *     responses:
 *       200:
 *         description: Service details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OptionalServiceCatalog'
 *
 * /optional-services/admin/all:
 *   get:
 *     summary: Super Admin - List all optional services (including inactive)
 *     tags: [Quotation - Optional Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All optional services
 *
 *   post:
 *     summary: Super Admin - Create new optional service
 *     tags: [Quotation - Optional Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OptionalServiceInput'
 *     responses:
 *       201:
 *         description: Service created successfully
 *
 * /optional-services/{id}/toggle:
 *   patch:
 *     summary: Super Admin - Toggle active/inactive status of an optional service
 *     tags: [Quotation - Optional Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /quotations/inquiry:
 *   post:
 *     summary: Request a Quotation (Submit Client Requirement Details)
 *     description: Submit detailed quotation inquiry including type, number of sites, site names, active machines, equipment types, contract duration, and implementation requirements.
 *     tags: [Quotation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationInquiryInput'
 *     responses:
 *       201:
 *         description: Quotation inquiry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/QuotationInquiry'
 *
 * /quotations/inquiries:
 *   get:
 *     summary: List all Quotation Inquiries
 *     description: Retrieve all inbound quotation inquiries with filters for status, quotation type, and search keyword.
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: quotationType
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quotation inquiries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuotationInquiry'
 *
 * /quotations:
 *   get:
 *     summary: List quotations (Role-filtered)
 *     description: Returns quotations based on caller role. Company Admin sees own company quotations, Super Admin sees all quotations.
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING_REVIEW, SENT, ACCEPTED, REJECTED, EXPIRED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of quotations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quotation'
 *
 * /quotations/{id}:
 *   get:
 *     summary: Get quotation details by ID or Quotation Number
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quotation snapshot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Quotation'
 *
 * /quotations/request:
 *   post:
 *     summary: Company Admin - Submit new quotation request / inquiry
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationRequestInput'
 *     responses:
 *       201:
 *         description: Quotation request submitted
 *
 * /quotations/send:
 *   post:
 *     summary: Super Admin - Create and send formal quotation proposal
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationSendInput'
 *     responses:
 *       201:
 *         description: Quotation sent to customer
 *
 * /quotations/{id}/accept:
 *   post:
 *     summary: Company Admin - Accept and digitally sign quotation
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               signedBy:
 *                 type: string
 *                 example: "John Doe (Managing Director)"
 *               signatureUrl:
 *                 type: string
 *                 example: "data:image/png;base64,iVBORw0KGgo..."
 *     responses:
 *       200:
 *         description: Quotation accepted and contract generated
 *
 * /quotations/{id}/reject:
 *   post:
 *     summary: Company Admin - Reject quotation proposal
 *     tags: [Quotation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Budget exceeded for current quarter. Requesting revised machine count."
 *     responses:
 *       200:
 *         description: Quotation status updated to REJECTED
 */
