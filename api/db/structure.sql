SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: active_storage_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_attachments (
    id bigint NOT NULL,
    name character varying NOT NULL,
    record_type character varying NOT NULL,
    record_id bigint NOT NULL,
    blob_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: active_storage_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_attachments_id_seq OWNED BY public.active_storage_attachments.id;


--
-- Name: active_storage_blobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_blobs (
    id bigint NOT NULL,
    key character varying NOT NULL,
    filename character varying NOT NULL,
    content_type character varying,
    metadata text,
    service_name character varying NOT NULL,
    byte_size bigint NOT NULL,
    checksum character varying,
    created_at timestamp(6) without time zone NOT NULL
);


--
-- Name: active_storage_blobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_blobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_blobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_blobs_id_seq OWNED BY public.active_storage_blobs.id;


--
-- Name: active_storage_variant_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.active_storage_variant_records (
    id bigint NOT NULL,
    blob_id bigint NOT NULL,
    variation_digest character varying NOT NULL
);


--
-- Name: active_storage_variant_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.active_storage_variant_records_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: active_storage_variant_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.active_storage_variant_records_id_seq OWNED BY public.active_storage_variant_records.id;


--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: audio_segments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audio_segments (
    id bigint NOT NULL,
    content bytea NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    duration double precision,
    sequence_number integer,
    speaker character varying NOT NULL,
    transcript text,
    updated_at timestamp(6) without time zone NOT NULL,
    voice_session_id bigint NOT NULL
);


--
-- Name: audio_segments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audio_segments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audio_segments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audio_segments_id_seq OWNED BY public.audio_segments.id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id bigint NOT NULL,
    agent_class character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    model_id character varying,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint
);


--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: chunks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chunks (
    id bigint NOT NULL,
    content text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    token_count integer DEFAULT 0,
    document_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: chunks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chunks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chunks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chunks_id_seq OWNED BY public.chunks.id;


--
-- Name: document_collections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_collections (
    id bigint NOT NULL,
    name character varying NOT NULL,
    chunking_strategy character varying DEFAULT 'paragraph'::character varying NOT NULL,
    chunk_size integer DEFAULT 512 NOT NULL,
    chunk_overlap integer DEFAULT 50 NOT NULL,
    embedding_model character varying DEFAULT 'text-embedding-3-small'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: document_collections_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_collections_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_collections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_collections_id_seq OWNED BY public.document_collections.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    name character varying NOT NULL,
    content_type character varying,
    size bigint,
    status character varying DEFAULT 'processing'::character varying NOT NULL,
    error_message text,
    document_collection_id bigint NOT NULL,
    user_id bigint,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: embeddings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.embeddings (
    id bigint NOT NULL,
    vector public.vector(1536),
    chunk_id bigint NOT NULL,
    model_used character varying DEFAULT 'text-embedding-3-small'::character varying NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: embeddings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.embeddings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: embeddings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.embeddings_id_seq OWNED BY public.embeddings.id;


--
-- Name: jwt_denylists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jwt_denylists (
    id bigint NOT NULL,
    exp timestamp(6) without time zone NOT NULL,
    jti character varying NOT NULL
);


--
-- Name: jwt_denylists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jwt_denylists_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jwt_denylists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jwt_denylists_id_seq OWNED BY public.jwt_denylists.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    chat_id bigint,
    content text,
    cost_cents numeric,
    created_at timestamp(6) without time zone NOT NULL,
    finish_reason character varying,
    input_tokens integer,
    model_id character varying,
    name character varying,
    output_tokens integer,
    role character varying NOT NULL,
    token_count integer,
    tool_call_id character varying,
    tool_calls jsonb,
    tool_result jsonb,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plans (
    id bigint NOT NULL,
    active boolean DEFAULT true NOT NULL,
    amount_cents integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    currency character varying DEFAULT 'usd'::character varying NOT NULL,
    features jsonb DEFAULT '{}'::jsonb NOT NULL,
    "interval" character varying DEFAULT 'month'::character varying NOT NULL,
    name character varying NOT NULL,
    slug character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    stripe_price_id character varying NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: plans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.plans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: plans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.plans_id_seq OWNED BY public.plans.id;


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.subscriptions (
    id bigint NOT NULL,
    cancel_at timestamp(6) without time zone,
    canceled_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone NOT NULL,
    current_period_end timestamp(6) without time zone,
    current_period_start timestamp(6) without time zone,
    plan_id bigint NOT NULL,
    status character varying DEFAULT 'incomplete'::character varying NOT NULL,
    stripe_customer_id character varying NOT NULL,
    stripe_subscription_id character varying NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint NOT NULL
);


--
-- Name: subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.subscriptions_id_seq OWNED BY public.subscriptions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    avatar_url character varying,
    created_at timestamp(6) without time zone NOT NULL,
    current_sign_in_at timestamp(6) without time zone,
    current_sign_in_ip character varying,
    email character varying DEFAULT ''::character varying NOT NULL,
    encrypted_password character varying DEFAULT ''::character varying NOT NULL,
    last_sign_in_at timestamp(6) without time zone,
    last_sign_in_ip character varying,
    magic_link_sent_at timestamp(6) without time zone,
    magic_link_token character varying,
    name character varying,
    plan character varying DEFAULT 'free'::character varying NOT NULL,
    provider character varying,
    remember_created_at timestamp(6) without time zone,
    reset_password_sent_at timestamp(6) without time zone,
    reset_password_token character varying,
    sign_in_count integer DEFAULT 0 NOT NULL,
    uid character varying,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: voice_presets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_presets (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    "default" boolean DEFAULT false,
    name character varying NOT NULL,
    provider character varying DEFAULT 'elevenlabs'::character varying NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    updated_at timestamp(6) without time zone NOT NULL,
    voice_id character varying NOT NULL
);


--
-- Name: voice_presets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.voice_presets_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: voice_presets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.voice_presets_id_seq OWNED BY public.voice_presets.id;


--
-- Name: voice_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_sessions (
    id bigint NOT NULL,
    audio_format character varying DEFAULT 'pcm_16000'::character varying,
    chat_id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    duration integer,
    ended_at timestamp(6) without time zone,
    started_at timestamp(6) without time zone NOT NULL,
    status character varying DEFAULT 'active'::character varying NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL,
    user_id bigint NOT NULL,
    voice_preset_id bigint
);


--
-- Name: voice_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.voice_sessions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: voice_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.voice_sessions_id_seq OWNED BY public.voice_sessions.id;


--
-- Name: active_storage_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments ALTER COLUMN id SET DEFAULT nextval('public.active_storage_attachments_id_seq'::regclass);


--
-- Name: active_storage_blobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_blobs ALTER COLUMN id SET DEFAULT nextval('public.active_storage_blobs_id_seq'::regclass);


--
-- Name: active_storage_variant_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records ALTER COLUMN id SET DEFAULT nextval('public.active_storage_variant_records_id_seq'::regclass);


--
-- Name: audio_segments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_segments ALTER COLUMN id SET DEFAULT nextval('public.audio_segments_id_seq'::regclass);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: chunks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chunks ALTER COLUMN id SET DEFAULT nextval('public.chunks_id_seq'::regclass);


--
-- Name: document_collections id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_collections ALTER COLUMN id SET DEFAULT nextval('public.document_collections_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: embeddings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embeddings ALTER COLUMN id SET DEFAULT nextval('public.embeddings_id_seq'::regclass);


--
-- Name: jwt_denylists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jwt_denylists ALTER COLUMN id SET DEFAULT nextval('public.jwt_denylists_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: plans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans ALTER COLUMN id SET DEFAULT nextval('public.plans_id_seq'::regclass);


--
-- Name: subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions ALTER COLUMN id SET DEFAULT nextval('public.subscriptions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: voice_presets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_presets ALTER COLUMN id SET DEFAULT nextval('public.voice_presets_id_seq'::regclass);


--
-- Name: voice_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_sessions ALTER COLUMN id SET DEFAULT nextval('public.voice_sessions_id_seq'::regclass);


--
-- Name: active_storage_attachments active_storage_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments
    ADD CONSTRAINT active_storage_attachments_pkey PRIMARY KEY (id);


--
-- Name: active_storage_blobs active_storage_blobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_blobs
    ADD CONSTRAINT active_storage_blobs_pkey PRIMARY KEY (id);


--
-- Name: active_storage_variant_records active_storage_variant_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records
    ADD CONSTRAINT active_storage_variant_records_pkey PRIMARY KEY (id);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: audio_segments audio_segments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_segments
    ADD CONSTRAINT audio_segments_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: chunks chunks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chunks
    ADD CONSTRAINT chunks_pkey PRIMARY KEY (id);


--
-- Name: document_collections document_collections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_collections
    ADD CONSTRAINT document_collections_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: embeddings embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT embeddings_pkey PRIMARY KEY (id);


--
-- Name: jwt_denylists jwt_denylists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jwt_denylists
    ADD CONSTRAINT jwt_denylists_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: plans plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plans
    ADD CONSTRAINT plans_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: subscriptions subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT subscriptions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: voice_presets voice_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_presets
    ADD CONSTRAINT voice_presets_pkey PRIMARY KEY (id);


--
-- Name: voice_sessions voice_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_sessions
    ADD CONSTRAINT voice_sessions_pkey PRIMARY KEY (id);


--
-- Name: index_active_storage_attachments_on_blob_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_active_storage_attachments_on_blob_id ON public.active_storage_attachments USING btree (blob_id);


--
-- Name: index_active_storage_attachments_uniqueness; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_attachments_uniqueness ON public.active_storage_attachments USING btree (record_type, record_id, name, blob_id);


--
-- Name: index_active_storage_blobs_on_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_blobs_on_key ON public.active_storage_blobs USING btree (key);


--
-- Name: index_active_storage_variant_records_uniqueness; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_active_storage_variant_records_uniqueness ON public.active_storage_variant_records USING btree (blob_id, variation_digest);


--
-- Name: index_audio_segments_on_speaker; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audio_segments_on_speaker ON public.audio_segments USING btree (speaker);


--
-- Name: index_audio_segments_on_voice_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audio_segments_on_voice_session_id ON public.audio_segments USING btree (voice_session_id);


--
-- Name: index_audio_segments_on_voice_session_id_and_sequence_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_audio_segments_on_voice_session_id_and_sequence_number ON public.audio_segments USING btree (voice_session_id, sequence_number);


--
-- Name: index_chats_on_agent_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chats_on_agent_class ON public.chats USING btree (agent_class);


--
-- Name: index_chats_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chats_on_user_id ON public.chats USING btree (user_id);


--
-- Name: index_chunks_on_document_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chunks_on_document_id ON public.chunks USING btree (document_id);


--
-- Name: index_chunks_on_document_id_and_position; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_chunks_on_document_id_and_position ON public.chunks USING btree (document_id, "position");


--
-- Name: index_document_collections_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_document_collections_on_name ON public.document_collections USING btree (name);


--
-- Name: index_documents_on_document_collection_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_documents_on_document_collection_id ON public.documents USING btree (document_collection_id);


--
-- Name: index_documents_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_documents_on_status ON public.documents USING btree (status);


--
-- Name: index_documents_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_documents_on_user_id ON public.documents USING btree (user_id);


--
-- Name: index_embeddings_on_chunk_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_embeddings_on_chunk_id ON public.embeddings USING btree (chunk_id);


--
-- Name: index_jwt_denylists_on_jti; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_jwt_denylists_on_jti ON public.jwt_denylists USING btree (jti);


--
-- Name: index_messages_on_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_chat_id ON public.messages USING btree (chat_id);


--
-- Name: index_messages_on_chat_id_and_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_chat_id_and_created_at ON public.messages USING btree (chat_id, created_at);


--
-- Name: index_messages_on_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_messages_on_role ON public.messages USING btree (role);


--
-- Name: index_plans_on_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_plans_on_active ON public.plans USING btree (active);


--
-- Name: index_plans_on_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_plans_on_slug ON public.plans USING btree (slug);


--
-- Name: index_plans_on_stripe_price_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_plans_on_stripe_price_id ON public.plans USING btree (stripe_price_id);


--
-- Name: index_subscriptions_on_plan_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_subscriptions_on_plan_id ON public.subscriptions USING btree (plan_id);


--
-- Name: index_subscriptions_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_subscriptions_on_status ON public.subscriptions USING btree (status);


--
-- Name: index_subscriptions_on_stripe_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_subscriptions_on_stripe_customer_id ON public.subscriptions USING btree (stripe_customer_id);


--
-- Name: index_subscriptions_on_stripe_subscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_subscriptions_on_stripe_subscription_id ON public.subscriptions USING btree (stripe_subscription_id);


--
-- Name: index_subscriptions_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_subscriptions_on_user_id ON public.subscriptions USING btree (user_id);


--
-- Name: index_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_email ON public.users USING btree (email);


--
-- Name: index_users_on_magic_link_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_magic_link_token ON public.users USING btree (magic_link_token);


--
-- Name: index_users_on_provider_and_uid; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_provider_and_uid ON public.users USING btree (provider, uid);


--
-- Name: index_users_on_reset_password_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_users_on_reset_password_token ON public.users USING btree (reset_password_token);


--
-- Name: index_voice_presets_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_voice_presets_on_name ON public.voice_presets USING btree (name);


--
-- Name: index_voice_presets_on_provider; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_voice_presets_on_provider ON public.voice_presets USING btree (provider);


--
-- Name: index_voice_sessions_on_chat_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_voice_sessions_on_chat_id ON public.voice_sessions USING btree (chat_id);


--
-- Name: index_voice_sessions_on_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_voice_sessions_on_status ON public.voice_sessions USING btree (status);


--
-- Name: index_voice_sessions_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_voice_sessions_on_user_id ON public.voice_sessions USING btree (user_id);


--
-- Name: index_voice_sessions_on_voice_preset_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_voice_sessions_on_voice_preset_id ON public.voice_sessions USING btree (voice_preset_id);


--
-- Name: messages fk_rails_0f670de7ba; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT fk_rails_0f670de7ba FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: documents fk_rails_1ce80a88ed; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_rails_1ce80a88ed FOREIGN KEY (document_collection_id) REFERENCES public.document_collections(id);


--
-- Name: chunks fk_rails_1dac2f17d2; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chunks
    ADD CONSTRAINT fk_rails_1dac2f17d2 FOREIGN KEY (document_id) REFERENCES public.documents(id);


--
-- Name: documents fk_rails_2be0318c46; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT fk_rails_2be0318c46 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: voice_sessions fk_rails_49e3c7e3eb; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_sessions
    ADD CONSTRAINT fk_rails_49e3c7e3eb FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: subscriptions fk_rails_63d3df128b; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_rails_63d3df128b FOREIGN KEY (plan_id) REFERENCES public.plans(id);


--
-- Name: embeddings fk_rails_64436c3194; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.embeddings
    ADD CONSTRAINT fk_rails_64436c3194 FOREIGN KEY (chunk_id) REFERENCES public.chunks(id);


--
-- Name: subscriptions fk_rails_933bdff476; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.subscriptions
    ADD CONSTRAINT fk_rails_933bdff476 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: audio_segments fk_rails_94d3777a3c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audio_segments
    ADD CONSTRAINT fk_rails_94d3777a3c FOREIGN KEY (voice_session_id) REFERENCES public.voice_sessions(id);


--
-- Name: active_storage_variant_records fk_rails_993965df05; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_variant_records
    ADD CONSTRAINT fk_rails_993965df05 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id);


--
-- Name: voice_sessions fk_rails_bb8dacfd8f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_sessions
    ADD CONSTRAINT fk_rails_bb8dacfd8f FOREIGN KEY (chat_id) REFERENCES public.chats(id);


--
-- Name: active_storage_attachments fk_rails_c3b3935057; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.active_storage_attachments
    ADD CONSTRAINT fk_rails_c3b3935057 FOREIGN KEY (blob_id) REFERENCES public.active_storage_blobs(id);


--
-- Name: voice_sessions fk_rails_c6b54b3aa8; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_sessions
    ADD CONSTRAINT fk_rails_c6b54b3aa8 FOREIGN KEY (voice_preset_id) REFERENCES public.voice_presets(id);


--
-- Name: chats fk_rails_e555f43151; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT fk_rails_e555f43151 FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20260306100003'),
('20260306100002'),
('20260306100001'),
('20260306000003'),
('20260306000002'),
('20260306000001'),
('20260304153137'),
('20260304000004'),
('20260304000002'),
('20260304000001'),
('20260304000000');

