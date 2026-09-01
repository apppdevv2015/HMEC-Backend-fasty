/**
 * @swagger
 * tags:
 *   - name: Quotation Requests
 *     description: Client Inbound Quotation Requests & Inquiries (Submit 8 Requirement Fields, Review Sites/Machines/Attachments)
 *   - name: Quotation
 *     description: Comprehensive Official Proposal Generation, Send, Digital Signature Contract Lifecycle
 *   - name: Optional Quotation Services
 *     description: Value-Added and Optional Quotation Services Catalog Management (Super Admin & Public)
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
 *         name:
 *           type: string
 *           example: "Telematics / ECU Integration"
 *           description: Human-readable service name
 *         description:
 *           type: string
 *           example: "Direct CAN-bus, IoT telematics gateway, and OEM electronic control unit integration for real-time telemetry streaming."
 *         isActive:
 *           type: boolean
 *           example: false
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
 *         description:
 *           type: string
 *           example: "Seamless bidirectional synchronization with corporate ERP, SAP S/4HANA, and Oracle EAM."
 *         sortOrder:
 *           type: integer
 *           example: 2
 *         isActive:
 *           type: boolean
 *           default: false
 *           example: false
 *           description: Default is false (inactive). Can be toggled active from UI.
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
 *               price:
 *                 type: number
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
 *     QuotationRequestInput:
 *       type: object
 *       required:
 *         - quotationType
 *         - numberOfSites
 *         - siteNames
 *         - activeMachines
 *         - equipmentTypes
 *         - contractDuration
 *       properties:
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
 *         optionalServices:
 *           type: array
 *           description: Selected optional services from catalog dropdown / multi-select
 *           items:
 *             type: string
 *           example: ["Telematics / ECU Integration", "SAP / ERP Integration"]
 *         implementationRequirements:
 *           type: string
 *           example: "Deploy telematics units across active machines within 2 weeks."
 *         additionalRequirements:
 *           type: string
 *           example: "On-site artisan training support."
 *     QuotationRequest:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "4710bd1b-ec80-47d0-b872-9753bb82bfc9"
 *         requestId:
 *           type: string
 *           example: "REQ-20260826-A7K4"
 *         userId:
 *           type: string
 *           nullable: true
 *         companyId:
 *           type: string
 *           nullable: true
 *         companyName:
 *           type: string
 *           nullable: true
 *         contactPerson:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           nullable: true
 *         phone:
 *           type: string
 *           nullable: true
 *         siteLocation:
 *           type: string
 *           nullable: true
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
 *           example: ["Excavator", "Dump Truck", "Dozer"]
 *         contractDuration:
 *           type: string
 *           example: "12 Months"
 *         optionalServices:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Telematics / ECU Integration", "SAP / ERP Integration"]
 *         implementationRequirements:
 *           type: string
 *           nullable: true
 *         additionalRequirements:
 *           type: string
 *           nullable: true
 *         attachmentUrl:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           example: "PENDING"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
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
 *     tags: [Optional Quotation Services]
 *     security: []
 *     parameters:
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
 *     tags: [Optional Quotation Services]
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
 * /optional-services/admin/all:
 *   get:
 *     summary: Super Admin - List all optional services (including inactive)
 *     tags: [Optional Quotation Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: All optional services
 *
 * /optional-services/{id}:
 *   get:
 *     summary: Get single optional service details
 *     tags: [Optional Quotation Services]
 *     security: []
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
 *   put:
 *     summary: Super Admin - Update an optional service
 *     tags: [Optional Quotation Services]
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
 *             $ref: '#/components/schemas/OptionalServiceInput'
 *     responses:
 *       200:
 *         description: Optional service updated successfully
 *
 *   delete:
 *     summary: Super Admin - Delete an optional service
 *     tags: [Optional Quotation Services]
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
 *         description: Optional service deleted successfully
 *
 * /optional-services/{id}/toggle:
 *   patch:
 *     summary: Super Admin - Toggle active/inactive status of an optional service
 *     tags: [Optional Quotation Services]
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
 * /quotations/requests:
 *   post:
 *     summary: Submit a Quotation Request (Client / Prospect Form)
 *     description: Submit detailed requirement fields including quotation type, sites, machine counts, equipment types, contract duration, requirements, and optional PDF attachment.
 *     tags: [Quotation Requests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/QuotationRequestInput'
 *     responses:
 *       201:
 *         description: Quotation request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/QuotationRequest'
 *
 *   get:
 *     summary: List Quotation Requests (Super Admin & Company Admin)
 *     description: Super Admin views all client requests; Company Admin views own requests. Supports filtering by status, quotationType, and search.
 *     tags: [Quotation Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_REVIEW, QUOTED, REJECTED]
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
 *         description: List of quotation requests
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
 *                     $ref: '#/components/schemas/QuotationRequest'
 *
 * /quotations/requests/{id}:
 *   get:
 *     summary: Get single Quotation Request by ID
 *     tags: [Quotation Requests]
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
 *         description: Quotation request details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/QuotationRequest'
 *
 *   put:
 *     summary: Super Admin - Update Quotation Request (Status / Notes)
 *     tags: [Quotation Requests]
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
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_REVIEW, QUOTED, REJECTED]
 *     responses:
 *       200:
 *         description: Quotation request updated
 *
 *   delete:
 *     summary: Super Admin - Delete Quotation Request
 *     tags: [Quotation Requests]
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
 *         description: Quotation request deleted
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
 *                   $ref: '#/components/schemas/Quotation'
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
