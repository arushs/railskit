---
title: Building a RAG Pipeline with RailsKit
description: How to add document intelligence to your Rails app with pgvector, embeddings, and hybrid search.
date: "2026-03-06"
author: RailsKit Team
category: guides
tags:
  - rag
  - embeddings
  - pgvector
  - tutorial
image: /images/blog/rag-pipeline.jpg
---

# Building a RAG Pipeline with RailsKit

Retrieval-Augmented Generation (RAG) lets your AI agents answer questions grounded in your own data. RailsKit ships with a complete RAG pipeline — here's how it works.

## Architecture

```
Document Upload → Content Extraction → Chunking → Embedding → pgvector
                                                                  ↓
User Query → Query Expansion → Hybrid Search (BM25 + Vector) → Reranking → LLM
```

## Step 1: Enable pgvector

RailsKit uses the `neighbor` gem for pgvector integration. The migration is already included:

```ruby
class EnablePgvector < ActiveRecord::Migration[8.0]
  def change
    enable_extension "vector"
  end
end
```

## Step 2: Upload Documents

Documents go through an async processing pipeline:

```ruby
document = collection.documents.create!(
  title: "Q3 Report",
  file: uploaded_file
)
# Triggers: extract → chunk → embed (all async)
```

## Step 3: Search

The hybrid search combines BM25 keyword matching with vector similarity:

```ruby
results = HybridSearchService.new(collection).search(
  "What were Q3 revenue figures?",
  limit: 5,
  expand: true,   # LLM query expansion
  rerank: true     # Cross-encoder reranking
)
```

## Step 4: Wire into Agents

The `KnowledgeSearchTool` wraps search as a tool your agents can call:

```ruby
agent = RubyLLM.agent(tools: [KnowledgeSearchTool])
agent.chat("Based on our Q3 report, what was the revenue trend?")
```

The agent automatically searches relevant documents and grounds its response in your data.

## What's Next

- **Multi-tenant collections** — each team gets isolated document stores
- **Incremental re-embedding** — only re-process changed chunks
- **Citation tracking** — link agent responses back to source documents
