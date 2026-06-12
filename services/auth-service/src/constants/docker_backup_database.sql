--
-- PostgreSQL database dump
--

\restrict jgW9fhWHtG8GhnhspZraqLIyQOJfBtOgjnARk55cuYPQR4wV0c6OVuD3z8Sa63B

-- Dumped from database version 15.17 (Debian 15.17-1.pgdg13+1)
-- Dumped by pg_dump version 15.17 (Debian 15.17-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Company; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Company" (
    id text NOT NULL,
    "companyCode" text NOT NULL,
    name text NOT NULL,
    "subscriptionStatus" text DEFAULT 'active'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Company" OWNER TO admin;

--
-- Name: Component; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Component" (
    id text NOT NULL,
    "machineId" text NOT NULL,
    category text NOT NULL,
    description text NOT NULL,
    "serialNumber" text NOT NULL,
    supplier text,
    "installHours" integer DEFAULT 0 NOT NULL,
    "currentHours" integer DEFAULT 0 NOT NULL,
    "plannedLife" integer DEFAULT 0 NOT NULL,
    "replacementCost" numeric(65,30) DEFAULT 0 NOT NULL,
    condition integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    install_date timestamp(3) without time zone,
    expected_life_hours integer,
    current_life_hours integer DEFAULT 0 NOT NULL,
    purchase_price numeric(15,2)
);


ALTER TABLE public."Component" OWNER TO admin;

--
-- Name: ComponentCategory; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."ComponentCategory" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ComponentCategory" OWNER TO admin;

--
-- Name: Machine; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Machine" (
    id text NOT NULL,
    name text NOT NULL,
    model text NOT NULL,
    "serialNumber" text NOT NULL,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    site text,
    status text DEFAULT 'Healthy'::text,
    cost_per_hour_target numeric(10,2),
    cost_per_ton_target numeric(10,2)
);


ALTER TABLE public."Machine" OWNER TO admin;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Role" OWNER TO admin;

--
-- Name: User; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text,
    "mobileNumber" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "roleId" text NOT NULL,
    "companyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO admin;

--
-- Name: component_costs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.component_costs (
    id text NOT NULL,
    component_id text NOT NULL,
    cost_type text NOT NULL,
    amount numeric(15,2) NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.component_costs OWNER TO admin;

--
-- Name: failure_predictions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.failure_predictions (
    id text NOT NULL,
    component_id text NOT NULL,
    predicted_remaining_life_hours integer NOT NULL,
    predicted_failure_date timestamp(3) without time zone NOT NULL,
    confidence_score integer NOT NULL,
    factors jsonb NOT NULL,
    calculated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failure_predictions OWNER TO admin;

--
-- Name: maintenance_logs; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.maintenance_logs (
    id text NOT NULL,
    company_id text NOT NULL,
    machine_id text NOT NULL,
    component_id text,
    technician text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    work text NOT NULL,
    cost numeric(15,2) NOT NULL,
    downtime text NOT NULL,
    status text DEFAULT 'Open'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.maintenance_logs OWNER TO admin;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    company_id text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO admin;

--
-- Name: recommendations; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.recommendations (
    id text NOT NULL,
    company_id text NOT NULL,
    machine_id text,
    component_id text,
    action_type text NOT NULL,
    recommendation_text text NOT NULL,
    rationale text,
    estimated_saving numeric(15,2) NOT NULL,
    priority text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.recommendations OWNER TO admin;

--
-- Name: subscription_plans; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscription_plans (
    id text NOT NULL,
    "planName" text NOT NULL,
    price numeric(65,30) NOT NULL,
    "machineLimit" integer NOT NULL,
    "staffLimit" integer NOT NULL,
    "validityDays" integer NOT NULL,
    "isPublic" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public.subscription_plans OWNER TO admin;

--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: admin
--

CREATE TABLE public.subscriptions (
    id text NOT NULL,
    "companyId" text NOT NULL,
    "userId" text,
    "planId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "paymentStatus" text DEFAULT 'PENDING'::text NOT NULL,
    "idempotencyKey" text,
    "subscriptionStartDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "subscriptionEndDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.subscriptions OWNER TO admin;

--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Company" (id, "companyCode", name, "subscriptionStatus", "createdAt", "updatedAt") FROM stdin;
00000000-0000-0000-0000-000000000000	HME-000001	HME Systems	active	2026-06-04 10:05:30.567	2026-06-04 10:05:30.567
f404ef7e-5418-40f7-88eb-bc2dd6d43542	HME-GLOBAL-01	HME Global	active	2026-06-04 10:05:30.581	2026-06-04 10:05:30.581
\.


--
-- Data for Name: Component; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Component" (id, "machineId", category, description, "serialNumber", supplier, "installHours", "currentHours", "plannedLife", "replacementCost", condition, "createdAt", "updatedAt", install_date, expected_life_hours, current_life_hours, purchase_price) FROM stdin;
a1b2c3d4-e5f6-4a1b-9c8d-7e6f5a4b3c2d	f7b3a1d2-e3f4-4b5a-9c8d-1e2f3a4b5c6d	Engine	C32 ACERT	SN-C32-ACERT	\N	0	0	0	0.000000000000000000000000000000	1	2026-06-04 10:05:30.993	2026-06-04 10:55:50.968	2025-06-04 10:05:30.992	18000	14500	250000.00
b2c3d4e5-f6a1-4b2c-ad8e-8f7a6b5c4d3e	f7b3a1d2-e3f4-4b5a-9c8d-1e2f3a4b5c6d	Transmission	Planetary Powershift	SN-PLANETARY-POWERSHIFT	\N	0	0	0	0.000000000000000000000000000000	1	2026-06-04 10:05:31.006	2026-06-04 10:55:50.979	2025-06-04 10:05:31.005	12000	8200	120000.00
c3d4e5f6-a1b2-4c3d-be9f-9a8b7c6d5e4f	f7b3a1d2-e3f4-4b5a-9c8d-1e2f3a4b5c6d	Tyre	Front Left - Michelin XDR	SN-MICHELIN-XDR	\N	0	0	0	0.000000000000000000000000000000	1	2026-06-04 10:05:31.011	2026-06-04 10:55:50.982	2025-06-04 10:05:31.01	5000	4800	35000.00
f57db47a-d601-4486-aef7-479bee7106b0	10a6b210-873b-4199-8184-f68ec32a8e89	Engine	Main Engine	SN-MAIN-ENGINE	\N	0	0	0	0.000000000000000000000000000000	1	2026-06-04 10:05:31.023	2026-06-04 10:55:50.989	\N	15000	12500	250000.00
1dd851b4-bc37-430e-b1d4-6fd768920226	10a6b210-873b-4199-8184-f68ec32a8e89	Transmission	PowerShift Trans	SN-POWERSHIFT-TRANS	\N	0	0	0	0.000000000000000000000000000000	1	2026-06-04 10:05:31.028	2026-06-04 10:55:50.993	\N	12000	8000	120000.00
6c96ae4f-09b7-4b6c-bd92-3ab89be55970	10a6b210-873b-4199-8184-f68ec32a8e89	Tyre	Front Left Tyre	SN-FRONT-LEFT-TYRE	\N	0	0	0	0.000000000000000000000000000000	1	2026-06-04 10:05:31.032	2026-06-04 10:55:50.997	\N	4000	3500	35000.00
\.


--
-- Data for Name: ComponentCategory; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."ComponentCategory" (id, name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Machine; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Machine" (id, name, model, "serialNumber", "companyId", "createdAt", "updatedAt", site, status, cost_per_hour_target, cost_per_ton_target) FROM stdin;
f7b3a1d2-e3f4-4b5a-9c8d-1e2f3a4b5c6d	CAT-777-DEMO	CAT 777G	SN-CAT-777-DEMO	f404ef7e-5418-40f7-88eb-bc2dd6d43542	2026-06-04 10:05:30.978	2026-06-04 10:55:50.955	Kalahari Mine	Healthy	1200.00	45.50
10a6b210-873b-4199-8184-f68ec32a8e89	DT-101	CAT 777	SN-DT-101	f404ef7e-5418-40f7-88eb-bc2dd6d43542	2026-06-04 10:05:30.989	2026-06-04 10:55:50.961	North Pit	active	\N	\N
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."Role" (id, name) FROM stdin;
87424def-d828-4896-927d-0e7b5c14af3c	super_admin
374137af-7b8c-4c4e-8cc2-d159fbb12256	admin
0d578def-e16c-4fb8-b676-15af73c45653	engineer
9e902162-62e6-4ea3-ad96-7886f3ea68f2	planner
5f3b3717-cc2d-4f27-b062-41bc879a3436	viewer
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public."User" (id, email, password, "firstName", "lastName", "mobileNumber", "isActive", "roleId", "companyId", "createdAt", "updatedAt") FROM stdin;
c1eca99d-1ab5-4a9f-a412-7cdc9aa8efc5	superadmin@hme.com	$2b$10$GKrp4a5BEvBqwQnlqsig/O2guEPDLWjprR1fZ1ZuNFBUFLeclm6fa	HME	SuperAdmin	\N	t	87424def-d828-4896-927d-0e7b5c14af3c	00000000-0000-0000-0000-000000000000	2026-06-04 10:05:30.941	2026-06-04 10:55:50.92
5b86051c-1ee7-4a8b-bf40-1063d3a2727d	admin@hme.com	$2b$10$3xkFAa0bgK3XymtPUiOACuXkZmDOjmECLA7Xu0lVFjiwfXkHmt.Qy	System	Admin	\N	t	374137af-7b8c-4c4e-8cc2-d159fbb12256	00000000-0000-0000-0000-000000000000	2026-06-04 10:05:30.946	2026-06-04 10:55:50.928
1cec27ba-a818-4ce1-afb5-062d59bd03b7	admin@gmail.com	$2b$10$oo3jFPWPXcLGVgFgcdM4DOxzoq7wLy96pr5E219FVGchuo0iAKcle	System	Admin	\N	t	374137af-7b8c-4c4e-8cc2-d159fbb12256	f404ef7e-5418-40f7-88eb-bc2dd6d43542	2026-06-04 10:05:30.958	2026-06-04 10:55:50.931
\.


--
-- Data for Name: component_costs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.component_costs (id, component_id, cost_type, amount, currency, date, notes, created_at) FROM stdin;
\.


--
-- Data for Name: failure_predictions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.failure_predictions (id, component_id, predicted_remaining_life_hours, predicted_failure_date, confidence_score, factors, calculated_at) FROM stdin;
6314560d-b388-441a-8592-cb760f921479	c3d4e5f6-a1b2-4c3d-be9f-9a8b7c6d5e4f	200	2026-06-14 10:55:51.021	92	{"wear_rate": "accelerated", "site_conditions": "harsh", "pressure_stability": "low"}	2026-06-04 10:55:51.022
\.


--
-- Data for Name: maintenance_logs; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.maintenance_logs (id, company_id, machine_id, component_id, technician, date, work, cost, downtime, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.notifications (id, company_id, message, type, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: recommendations; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.recommendations (id, company_id, machine_id, component_id, action_type, recommendation_text, rationale, estimated_saving, priority, status, created_at) FROM stdin;
f9e4b965-5495-44ae-bc58-c0d6e535ae15	f404ef7e-5418-40f7-88eb-bc2dd6d43542	f7b3a1d2-e3f4-4b5a-9c8d-1e2f3a4b5c6d	a1b2c3d4-e5f6-4a1b-9c8d-7e6f5a4b3c2d	Rebuild	Schedule Mid-Life Engine Rebuild within 500 hours.	Engine hours (14.5k) approaching 85% of expected life (18k). Oil analysis showing slight increase in iron particles.	85000.00	High	pending	2026-06-04 10:55:51.009
85a026a7-7592-4380-838d-480ece765d48	f404ef7e-5418-40f7-88eb-bc2dd6d43542	f7b3a1d2-e3f4-4b5a-9c8d-1e2f3a4b5c6d	c3d4e5f6-a1b2-4c3d-be9f-9a8b7c6d5e4f	Replace	Replace Front Left Tyre immediately.	Tyre life (4.8k) is at 96% of expected life (5k). High risk of blowout in current operating conditions.	12000.00	Critical	pending	2026-06-04 10:55:51.009
\.


--
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.subscription_plans (id, "planName", price, "machineLimit", "staffLimit", "validityDays", "isPublic", "isActive") FROM stdin;
9d42c784-c748-479d-8c08-d2b9e7390754	demo	0.000000000000000000000000000000	3	5	14	t	t
02260a26-eeb1-4ebe-b716-d7dc6d95c4e3	silver	100.000000000000000000000000000000	10	20	30	t	t
c9073ff5-cc24-4a82-85d0-962d3e3bfe69	premium	300.000000000000000000000000000000	100	100	30	t	t
\.


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: admin
--

COPY public.subscriptions (id, "companyId", "userId", "planId", status, "paymentStatus", "idempotencyKey", "subscriptionStartDate", "subscriptionEndDate", "createdAt", "updatedAt") FROM stdin;
56f12f23-3b04-491f-9cdf-b2e268849999	00000000-0000-0000-0000-000000000000	\N	c9073ff5-cc24-4a82-85d0-962d3e3bfe69	active	PAID	default-system-premium-sub	2026-06-04 10:05:30.961	2027-06-04 10:05:30.961	2026-06-04 10:05:30.962	2026-06-04 10:55:50.944
a9c5a78d-64d0-47ae-aab7-8a9fef018f16	f404ef7e-5418-40f7-88eb-bc2dd6d43542	\N	c9073ff5-cc24-4a82-85d0-962d3e3bfe69	active	PAID	default-global-premium-sub	2026-06-04 10:05:30.965	2027-06-04 10:05:30.965	2026-06-04 10:05:30.967	2026-06-04 10:55:50.95
\.


--
-- Name: Company Company_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Company"
    ADD CONSTRAINT "Company_pkey" PRIMARY KEY (id);


--
-- Name: ComponentCategory ComponentCategory_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."ComponentCategory"
    ADD CONSTRAINT "ComponentCategory_pkey" PRIMARY KEY (id);


--
-- Name: Component Component_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Component"
    ADD CONSTRAINT "Component_pkey" PRIMARY KEY (id);


--
-- Name: Machine Machine_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Machine"
    ADD CONSTRAINT "Machine_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: component_costs component_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component_costs
    ADD CONSTRAINT component_costs_pkey PRIMARY KEY (id);


--
-- Name: failure_predictions failure_predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.failure_predictions
    ADD CONSTRAINT failure_predictions_pkey PRIMARY KEY (id);


--
-- Name: maintenance_logs maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: recommendations recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_pkey PRIMARY KEY (id);


--
-- Name: subscription_plans subscription_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscription_plans
    ADD CONSTRAINT subscription_plans_pkey PRIMARY KEY (id);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: Company_companyCode_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Company_companyCode_key" ON public."Company" USING btree ("companyCode");


--
-- Name: Company_name_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Company_name_key" ON public."Company" USING btree (name);


--
-- Name: ComponentCategory_name_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "ComponentCategory_name_key" ON public."ComponentCategory" USING btree (name);


--
-- Name: Component_serialNumber_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Component_serialNumber_key" ON public."Component" USING btree ("serialNumber");


--
-- Name: Machine_serialNumber_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Machine_serialNumber_key" ON public."Machine" USING btree ("serialNumber");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: subscription_plans_planName_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "subscription_plans_planName_key" ON public.subscription_plans USING btree ("planName");


--
-- Name: subscriptions_idempotencyKey_key; Type: INDEX; Schema: public; Owner: admin
--

CREATE UNIQUE INDEX "subscriptions_idempotencyKey_key" ON public.subscriptions USING btree ("idempotencyKey");


--
-- Name: Component Component_machineId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."Component"
    ADD CONSTRAINT "Component_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES public."Machine"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: component_costs component_costs_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.component_costs
    ADD CONSTRAINT component_costs_component_id_fkey FOREIGN KEY (component_id) REFERENCES public."Component"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: failure_predictions failure_predictions_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.failure_predictions
    ADD CONSTRAINT failure_predictions_component_id_fkey FOREIGN KEY (component_id) REFERENCES public."Component"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: maintenance_logs maintenance_logs_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_component_id_fkey FOREIGN KEY (component_id) REFERENCES public."Component"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: maintenance_logs maintenance_logs_machine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.maintenance_logs
    ADD CONSTRAINT maintenance_logs_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public."Machine"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: notifications notifications_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_company_id_fkey FOREIGN KEY (company_id) REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recommendations recommendations_company_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recommendations recommendations_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_component_id_fkey FOREIGN KEY (component_id) REFERENCES public."Component"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: recommendations recommendations_machine_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.recommendations
    ADD CONSTRAINT recommendations_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public."Machine"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: subscriptions subscriptions_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public."Company"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: subscriptions subscriptions_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: admin
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES public.subscription_plans(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict jgW9fhWHtG8GhnhspZraqLIyQOJfBtOgjnARk55cuYPQR4wV0c6OVuD3z8Sa63B

