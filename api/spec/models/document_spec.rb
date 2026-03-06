# frozen_string_literal: true

require "rails_helper"

RSpec.describe Document, type: :model do
  describe "validations" do
    it { is_expected.to validate_presence_of(:title) }
    it { is_expected.to validate_presence_of(:source_type) }
    it { is_expected.to validate_inclusion_of(:source_type).in_array(%w[text url pdf html]) }
    it { is_expected.to validate_presence_of(:status) }
    it { is_expected.to validate_inclusion_of(:status).in_array(%w[pending processing ready error]) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:collection) }
    it { is_expected.to have_many(:chunks).dependent(:destroy) }
  end

  describe "scopes" do
    let!(:ready_doc) { create(:document, status: "ready") }
    let!(:pending_doc) { create(:document, status: "pending") }

    it ".ready returns only ready documents" do
      expect(Document.ready).to contain_exactly(ready_doc)
    end

    it ".pending returns only pending documents" do
      expect(Document.pending).to contain_exactly(pending_doc)
    end
  end
end
