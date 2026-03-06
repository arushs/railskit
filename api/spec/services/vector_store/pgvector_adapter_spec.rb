# frozen_string_literal: true

require "rails_helper"

RSpec.describe VectorStore::PgvectorAdapter do
  let(:adapter) { described_class.new(distance_metric: :cosine) }
  let(:collection) { create(:document_collection) }
  let(:document) { create(:document, document_collection: collection) }

  it "stores an embedding" do
    chunk = create(:chunk, document: document)
    expect { adapter.store(chunk, Array.new(1536) { rand }) }.to change(Embedding, :count).by(1)
  end

  it "deletes an embedding" do
    chunk = create(:chunk, document: document)
    create(:embedding, chunk: chunk)
    expect { adapter.delete(chunk.id) }.to change(Embedding, :count).by(-1)
  end

  it "rejects unknown metrics" do
    expect { described_class.new(distance_metric: :manhattan) }.to raise_error(ArgumentError)
  end
end
