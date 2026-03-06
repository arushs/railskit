# frozen_string_literal: true

require "rails_helper"

RSpec.describe Document, type: :model do
  let(:collection) { create(:collection) }

  describe "associations" do
    it { is_expected.to belong_to(:collection) }
    it { is_expected.to have_many(:chunks).dependent(:destroy) }
  end

  describe "validations" do
    it "requires a title" do
      doc = build(:document, title: nil, collection: collection)
      expect(doc).not_to be_valid
    end

    it "requires a valid status" do
      doc = build(:document, status: "bogus", collection: collection)
      expect(doc).not_to be_valid
    end

    it "accepts valid statuses" do
      %w[pending processing ready error].each do |status|
        doc = build(:document, status: status, collection: collection)
        expect(doc).to be_valid
      end
    end
  end

  describe "scopes" do
    let!(:pending) { create(:document, collection: collection) }
    let!(:ready) { create(:document, :ready, collection: collection) }
    let!(:errored) { create(:document, :errored, collection: collection) }

    it ".pending returns pending docs" do
      expect(Document.pending).to include(pending)
      expect(Document.pending).not_to include(ready)
    end

    it ".ready returns ready docs" do
      expect(Document.ready).to include(ready)
    end

    it ".errored returns error docs" do
      expect(Document.errored).to include(errored)
    end
  end

  describe "#process!" do
    let(:doc) { create(:document, collection: collection, raw_content: "Test content here.") }

    before do
      allow(Rag::EmbeddingService).to receive(:embed_batch).and_return([[0.1] * 1536])
    end

    it "transitions to ready after processing" do
      doc.process!
      expect(doc.reload.status).to eq("ready")
    end

    it "creates chunks" do
      doc.process!
      expect(doc.chunks.count).to be >= 1
    end

    it "handles errors gracefully" do
      allow(Rag::EmbeddingService).to receive(:embed_batch).and_raise(StandardError, "API down")
      doc.process!
      expect(doc.reload.status).to eq("error")
      expect(doc.error_message).to include("API down")
    end
  end

  describe "#reprocess!" do
    let(:doc) { create(:document, :ready, collection: collection) }

    it "resets status and enqueues job" do
      doc.reprocess!
      expect(doc.reload.status).to eq("pending")
    end
  end
end
