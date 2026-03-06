# frozen_string_literal: true

require "rails_helper"

RSpec.describe Document, type: :model do
  describe "associations" do
    it { should belong_to(:document_collection) }
    it { should belong_to(:user).optional }
    it { should have_many(:chunks).dependent(:destroy) }
  end

  describe "validations" do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:status) }
    it { should validate_inclusion_of(:status).in_array(%w[processing ready error]) }
  end

  describe "scopes" do
    let!(:processing_doc) { create(:document, status: "processing") }
    let!(:ready_doc) { create(:document, status: "ready") }
    let!(:error_doc) { create(:document, status: "error") }

    it "filters by processing" do
      expect(Document.processing).to contain_exactly(processing_doc)
    end

    it "filters by ready" do
      expect(Document.ready).to contain_exactly(ready_doc)
    end

    it "filters by errored" do
      expect(Document.errored).to contain_exactly(error_doc)
    end
  end

  describe "#mark_ready!" do
    let(:document) { create(:document, status: "processing") }

    it "updates status to ready" do
      document.mark_ready!
      expect(document.reload.status).to eq("ready")
    end
  end

  describe "#mark_error!" do
    let(:document) { create(:document, status: "processing") }

    it "updates status to error with message" do
      document.mark_error!("Something broke")
      expect(document.reload.status).to eq("error")
      expect(document.reload.error_message).to eq("Something broke")
    end
  end
end
