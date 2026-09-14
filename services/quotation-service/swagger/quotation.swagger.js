/**
 * @swagger
 * tags:
 *   - name: Quotation Requests
 *     description: Client Inbound Quotation Requests & Inquiries (Submit 8 Requirement Fields, Review Sites/Machines/Attachments)
 *   - name: Quotation
 *     description: Comprehensive Official Proposal Generation, Send, Digital Signature Contract Lifecycle
 *   - name: Optional Quotation Services
 *     description: Value-Added and Optional Quotation Services Catalog Management (Super Admin & Public)
 *   - name: Contract
 *     description: Contract Creation and Lifecycle Management from Accepted Quotations
 *   - name: Invoice
 *     description: Invoice Generation, Listing, and PDF Download from Active Contracts (Super Admin generates, Company Admin views own)
 *   - name: Billing Profile
 *     description: Super Admin's own business and bank details, used to auto-fill every generated invoice
 *   - name: Payment Proof
 *     description: User submits proof of payment (EFT) against an invoice; Super Admin reviews submitted proofs
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
 *     Contract:
 *       type: object
 *       description: Contract record generated from an ACCEPTED quotation, linked via quotationId (FK)
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "d1e2f3a4-b5c6-7890-abcd-ef1234567890"
 *         contractNumber:
 *           type: string
 *           example: "CNT-20260908-XT3B"
 *         quotationId:
 *           type: string
 *           format: uuid
 *           description: Foreign key to the source Quotation (must be ACCEPTED)
 *         companyId:
 *           type: string
 *           format: uuid
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         poNumber:
 *           type: string
 *           nullable: true
 *           example: "PO-XYZ-2026-117"
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [DRAFT, SENT, ACTIVE, EXPIRED, TERMINATED]
 *           example: "SENT"
 *         sentAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         quotation:
 *           $ref: '#/components/schemas/Quotation'
 *           description: Full quotation details, included automatically via the quotationId relation
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     ContractCreateInput:
 *       type: object
 *       required:
 *         - quotationId
 *         - startDate
 *         - endDate
 *       properties:
 *         quotationId:
 *           type: string
 *           format: uuid
 *           example: "ff54effc-9d1a-4ba5-a861-e87a9b56cce8"
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2026-09-15"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2028-09-13"
 *         poNumber:
 *           type: string
 *           example: "PO-XYZ-2026-117"
 *         description:
 *           type: string
 *           example: "Initial contract for XYZ Construction Ltd covering 24-month term."
 *
 *
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
 *         attachmentUrl:
 *           type: string
 *           example: "https://storage.googleapis.com/hme/survey.pdf"
 *
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
 *
 *     InvoiceLineItem:
 *       type: object
 *       properties:
 *         description:
 *           type: string
 *           example: "Services as per contract CNT-20260908-XT3B"
 *         quantity:
 *           type: integer
 *           example: 10
 *         unitPrice:
 *           type: number
 *           format: float
 *           example: 10000.00
 *         amount:
 *           type: number
 *           format: float
 *           example: 100000.00
 *
 *     Invoice:
 *       type: object
 *       description: Invoice record generated from an active Contract, with issuer/bank details snapshotted at generation time
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *         invoiceNumber:
 *           type: string
 *           example: "INV-2025-001"
 *         contractId:
 *           type: string
 *           format: uuid
 *         companyId:
 *           type: string
 *           format: uuid
 *         quotationId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         billToName:
 *           type: string
 *           example: "ABC Technologies Pvt Ltd"
 *         billToAddress:
 *           type: string
 *           nullable: true
 *           example: "456 Tech Park, Bangalore, Karnataka, India - 560001"
 *         billToGstin:
 *           type: string
 *           nullable: true
 *           example: "29ABCDE5678F1Z5"
 *         issuerSnapshot:
 *           type: object
 *           description: Snapshot of the issuer's (Super Admin's) business details at generation time
 *           properties:
 *             businessName:
 *               type: string
 *               example: "HMEC Pvt Ltd"
 *             addressLine:
 *               type: string
 *               example: "123 Business Park, Indore, Madhya Pradesh, India - 452001"
 *             gstin:
 *               type: string
 *               example: "23ABCDE1234F1Z5"
 *             phone:
 *               type: string
 *               example: "+91 98765 43210"
 *             email:
 *               type: string
 *               example: "billing@hmec.com"
 *         bankDetailsSnapshot:
 *           type: object
 *           description: Snapshot of the bank details at generation time
 *           properties:
 *             bankName:
 *               type: string
 *               example: "HDFC Bank"
 *             accountHolderName:
 *               type: string
 *               example: "HMEC Pvt Ltd"
 *             accountNumber:
 *               type: string
 *               example: "123456789012"
 *             ifscCode:
 *               type: string
 *               example: "HDFC0001234"
 *             branch:
 *               type: string
 *               example: "Indore Main Branch"
 *         contractNumber:
 *           type: string
 *           example: "CNT-20260908-XT3B"
 *         quotationNumber:
 *           type: string
 *           nullable: true
 *           example: "QT-2025-001"
 *         contractPeriodStart:
 *           type: string
 *           format: date-time
 *         contractPeriodEnd:
 *           type: string
 *           format: date-time
 *         lineItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/InvoiceLineItem'
 *         subtotal:
 *           type: number
 *           format: float
 *           example: 100000.00
 *         totalAmount:
 *           type: number
 *           format: float
 *           example: 100000.00
 *         paymentTerms:
 *           type: string
 *           example: "Payment is due within 30 days from the invoice date."
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Please include invoice number in payment reference."
 *         status:
 *           type: string
 *           enum: [GENERATED, SENT, PAID, OVERDUE, CANCELLED]
 *           example: "GENERATED"
 *         invoiceDate:
 *           type: string
 *           format: date-time
 *         dueDate:
 *           type: string
 *           format: date-time
 *         pdfUrl:
 *           type: string
 *           nullable: true
 *         createdById:
 *           type: string
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     InvoiceCreateInput:
 *       type: object
 *       required:
 *         - contractId
 *       properties:
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: The active Contract to generate this invoice from. Company, quotation, and bank details are all derived automatically.
 *           example: "d1e2f3a4-b5c6-7890-abcd-ef1234567890"
 *         lineItems:
 *           type: array
 *           description: Optional override — if omitted, a single line item is auto-built from the contract's linked quotation
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Defaults to invoiceDate + 30 days if omitted
 *         paymentTerms:
 *           type: string
 *           example: "Payment is due within 30 days from the invoice date."
 *         notes:
 *           type: string
 *           example: "Please include invoice number in payment reference."
 *
 *     BillingProfile:
 *       type: object
 *       description: Super Admin's own business and bank details — used to stamp every generated invoice
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         businessName:
 *           type: string
 *           example: "HMEC Pvt Ltd"
 *         addressLine:
 *           type: string
 *           example: "123 Business Park, Indore, Madhya Pradesh, India - 452001"
 *         gstin:
 *           type: string
 *           nullable: true
 *           example: "23ABCDE1234F1Z5"
 *         phone:
 *           type: string
 *           nullable: true
 *           example: "+91 98765 43210"
 *         email:
 *           type: string
 *           nullable: true
 *           example: "billing@hmec.com"
 *         bankName:
 *           type: string
 *           example: "HDFC Bank"
 *         accountHolderName:
 *           type: string
 *           example: "HMEC Pvt Ltd"
 *         accountNumber:
 *           type: string
 *           example: "123456789012"
 *         ifscCode:
 *           type: string
 *           example: "HDFC0001234"
 *         branch:
 *           type: string
 *           nullable: true
 *           example: "Indore Main Branch"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     BillingProfileInput:
 *       type: object
 *       required:
 *         - businessName
 *         - addressLine
 *         - bankName
 *         - accountHolderName
 *         - accountNumber
 *         - ifscCode
 *       properties:
 *         businessName:
 *           type: string
 *           example: "HMEC Pvt Ltd"
 *         addressLine:
 *           type: string
 *           example: "123 Business Park, Indore, Madhya Pradesh, India - 452001"
 *         gstin:
 *           type: string
 *           example: "23ABCDE1234F1Z5"
 *         phone:
 *           type: string
 *           example: "+91 98765 43210"
 *         email:
 *           type: string
 *           example: "billing@hmec.com"
 *         bankName:
 *           type: string
 *           example: "HDFC Bank"
 *         accountHolderName:
 *           type: string
 *           example: "HMEC Pvt Ltd"
 *         accountNumber:
 *           type: string
 *           example: "123456789012"
 *         ifscCode:
 *           type: string
 *           example: "HDFC0001234"
 *         branch:
 *           type: string
 *           example: "Indore Main Branch"
 *
 *     PaymentProof:
 *       type: object
 *       description: Proof of payment submitted by a user against an invoice, reviewed by Super Admin
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "9c8b7a6d-5e4f-3210-9876-543210fedcba"
 *         invoiceId:
 *           type: string
 *           format: uuid
 *         invoiceNumber:
 *           type: string
 *           example: "INV-2025-001"
 *         companyId:
 *           type: string
 *           format: uuid
 *         submittedById:
 *           type: string
 *           nullable: true
 *         submittedByName:
 *           type: string
 *           nullable: true
 *           example: "John Doe"
 *         submittedByEmail:
 *           type: string
 *           nullable: true
 *           example: "johndoe@miningcorp.com"
 *         paymentMethod:
 *           type: string
 *           example: "BANK_TRANSFER"
 *         paymentDate:
 *           type: string
 *           format: date-time
 *         amountPaid:
 *           type: number
 *           format: float
 *           example: 47871.00
 *         transactionReference:
 *           type: string
 *           example: "TXN123456789"
 *         proofFileUrl:
 *           type: string
 *           example: "/uploads/payment-proofs/proof-9c8b7a6d.pdf"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [PENDING, PAID]
 *           example: "PENDING"
 *         verifiedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         verifiedBy:
 *           type: string
 *           nullable: true
 *           example: "Super Admin"
 *     PaymentProofSubmitInput:
 *       type: object
 *       required:
 *         - paymentMethod
 *         - paymentDate
 *         - amountPaid
 *         - transactionReference
 *         - proofFile
 *       properties:
 *         paymentMethod:
 *           type: string
 *           example: "BANK_TRANSFER"
 *         paymentDate:
 *           type: string
 *           format: date
 *           example: "2026-09-10"
 *         amountPaid:
 *           type: number
 *           example: 47871.00
 *         transactionReference:
 *           type: string
 *           example: "TXN123456789"
 *         proofFile:
 *           type: string
 *           format: binary
 *           description: Payment proof file (JPG, PNG, or PDF, max 5MB)
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
 *
 * /quotations/contracts:
 *   get:
 *     summary: List contracts (Role-filtered)
 *     description: Super Admin sees all contracts, Company Admin sees only their own company's contracts.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [DRAFT, SENT, ACTIVE, EXPIRED, TERMINATED]
 *     responses:
 *       200:
 *         description: List of contracts
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
 *                     $ref: '#/components/schemas/Contract'
 *
 *   post:
 *     summary: Super Admin - Create and send a contract from an ACCEPTED quotation
 *     description: quotationId links the contract to its source quotation. Company details, machine counts, pricing, and services are all derived from the linked quotation — nothing is duplicated.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractCreateInput'
 *     responses:
 *       201:
 *         description: Contract created and sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *
 * /quotations/contracts/{id}:
 *   get:
 *     summary: Get contract details by ID or Contract Number
 *     tags: [Contract]
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
 *         description: Contract details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *
 *   put:
 *     summary: Super Admin - Update a contract
 *     tags: [Contract]
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               poNumber:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [DRAFT, SENT, ACTIVE, EXPIRED, TERMINATED]
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *
 *   delete:
 *     summary: Super Admin - Delete a contract
 *     tags: [Contract]
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
 *         description: Contract deleted successfully
 */

/**
 * @swagger
 * /quotations/contracts/{id}/pdf:
 *   get:
 *     summary: View or download the contract PDF
 *     description: Streams a backend-generated PDF of the accepted contract. Omit download or set it to false for inline viewing; set download=true to force download.
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Contract UUID or Contract Number
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *           default: false
 *         description: "true = force download (attachment), false/omitted = inline PDF view"
 *     responses:
 *       200:
 *         description: Contract PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Contract PDF could not be generated
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied
 *       404:
 *         description: Contract not found
 *

 * /quotations/contracts/{id}/accept:
 *   post:
 *     summary: Company Admin - Accept a contract with mandatory digital signature
 *     description: Accepts a SENT contract. Requires a signature image file (multipart/form-data) — the contract cannot transition to ACCEPTED without it. Only works on contracts belonging to the caller's own company.
 *     tags: [Contract]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - signatureFile
 *               - signedBy
 *             properties:
 *               signatureFile:
 *                 type: string
 *                 format: binary
 *                 description: Signature image (PNG/JPEG/WEBP, max 2MB)
 *               signedBy:
 *                 type: string
 *                 example: "John Doe (Managing Director)"
 *               acceptanceDescription:
 *                 type: string
 *                 example: "Approved on behalf of the company after internal review."
 *     responses:
 *       200:
 *         description: Contract accepted and signed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *
 * /quotations/contracts/{id}/reject:
 *   post:
 *     summary: Company Admin - Reject a contract
 *     description: Rejects a SENT contract. No signature required — only a rejection reason. Only works on contracts belonging to the caller's own company.
 *     tags: [Contract]
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
 *             required:
 *               - rejectionReason
 *             properties:
 *               rejectionReason:
 *                 type: string
 *                 example: "Pricing does not fit current budget cycle."
 *     responses:
 *       200:
 *         description: Contract rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Contract'
 *
 * /quotations/invoices:
 *   get:
 *     summary: List invoices (Role-filtered)
 *     description: Super Admin sees all invoices, Company Admin sees only their own company's invoices.
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [GENERATED, SENT, PAID, OVERDUE, CANCELLED]
 *       - in: query
 *         name: contractId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoices
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
 *                     $ref: '#/components/schemas/Invoice'
 *
 *   post:
 *     summary: Super Admin - Generate and send an invoice from a Contract
 *     description: Company, contract, and quotation data are pulled from the database automatically. Bank/issuer details come from the active Billing Profile. Invoice number is auto-generated.
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InvoiceCreateInput'
 *     responses:
 *       201:
 *         description: Invoice generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *
 * /quotations/invoices/{id}:
 *   get:
 *     summary: Get invoice details by ID or Invoice Number
 *     tags: [Invoice]
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
 *         description: Invoice details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Invoice'
 *
 * /quotations/invoices/{id}/pdf:
 *   get:
 *     summary: View or download the generated invoice PDF
 *     description: Streams a backend-generated PDF of the invoice, styled to match the approved invoice template. Pass ?download=true for an attachment (force download); omit for inline viewing in browser.
 *     tags: [Invoice]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: download
 *         schema:
 *           type: boolean
 *         description: "true = force download (attachment), false/omitted = inline view"
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *
 * /quotations/billing-profile:
 *   get:
 *     summary: Super Admin - Get own billing profile (business + bank details)
 *     tags: [Billing Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing profile details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BillingProfile'
 *
 *   post:
 *     summary: Super Admin - Create or update billing profile
 *     description: Only one active billing profile exists per platform. If one already exists, this updates it in place.
 *     tags: [Billing Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillingProfileInput'
 *     responses:
 *       200:
 *         description: Billing profile saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BillingProfile'
 *
 *   put:
 *     summary: Super Admin - Update billing profile (alias of POST)
 *     tags: [Billing Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BillingProfileInput'
 *     responses:
 *       200:
 *         description: Billing profile saved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BillingProfile'
 *
 * /quotations/invoices/{id}/payment-proof:
 *   post:
 *     summary: User - Submit payment proof (EFT) for an invoice
 *     description: The invoice's own company user submits payment method, date, amount, transaction reference, and a proof file for the given invoice. Captures the submitter's identity automatically from the auth token.
 *     tags: [Payment Proof]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice UUID or Invoice Number
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PaymentProofSubmitInput'
 *     responses:
 *       201:
 *         description: Payment proof submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentProof'
 *       400:
 *         description: Validation error or missing proof file
 *       401:
 *         description: Authentication required
 *       404:
 *         description: Invoice not found
 *
 * /quotations/payment-proofs:
 *   get:
 *     summary: Super Admin - List all submitted payment proofs
 *     description: Returns every payment proof submitted across invoices, including which user submitted it and for which invoice. Super Admin only.
 *     tags: [Payment Proof]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: invoiceId
 *         schema:
 *           type: string
 *         description: Filter proofs for a single invoice
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *         description: Filter proofs for a single company
 *     responses:
 *       200:
 *         description: List of payment proofs
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
 *                     $ref: '#/components/schemas/PaymentProof'
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied (not Super Admin)
 *
 * /quotations/payment-proofs/{id}/verify:
 *   put:
 *     summary: Super Admin - Verify a submitted payment proof
 *     description: Marks the PaymentProof as PAID and updates the linked Invoice status to PAID. Only works on proofs currently in PENDING status.
 *     tags: [Payment Proof]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: PaymentProof UUID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 example: "Amount matches bank statement, confirmed."
 *     responses:
 *       200:
 *         description: Payment proof verified and invoice marked as paid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentProof'
 *       400:
 *         description: Already verified or validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Access denied (not Super Admin)
 *       404:
 *         description: Payment proof not found
 */
