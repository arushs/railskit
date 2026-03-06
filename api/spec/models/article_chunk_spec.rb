require "rails_helper"

RSpec.describe ArticleChunk, type: :model do
  let(:article) { Article.create!(title: "Test", body: "Content") }

  describe "validations" do
    it "requires chunk_text" do
      chunk = ArticleChunk.new(article: article, chunk_index: 0)
      expect(chunk).not_to be_valid
      expect(chunk.errors[:chunk_text]).to include("can't be blank")
    end

    it "requires chunk_index" do
      chunk = ArticleChunk.new(article: article, chunk_text: "text")
      expect(chunk).not_to be_valid
    end

    it "enforces unique chunk_index per article" do
      ArticleChunk.create!(article: article, chunk_text: "first", chunk_index: 0)
      dupe = ArticleChunk.new(article: article, chunk_text: "second", chunk_index: 0)
      expect(dupe).not_to be_valid
    end

    it "is valid with all required fields" do
      chunk = ArticleChunk.new(article: article, chunk_text: "text", chunk_index: 0)
      expect(chunk).to be_valid
    end
  end

  describe "searchable tsvector" do
    it "auto-populates searchable on save" do
      chunk = ArticleChunk.create!(article: article, chunk_text: "Ruby on Rails framework", chunk_index: 0)
      chunk.reload
      expect(chunk.searchable).not_to be_nil
    end
  end

  describe ".search_by_text" do
    before do
      ArticleChunk.create!(article: article, chunk_text: "Ruby on Rails is a web framework for building applications", chunk_index: 0)
      ArticleChunk.create!(article: article, chunk_text: "Python Django is another popular web framework", chunk_index: 1)
    end

    it "finds chunks matching the query" do
      results = ArticleChunk.search_by_text("Rails")
      expect(results.count).to eq(1)
      expect(results.first.chunk_index).to eq(0)
    end

    it "returns empty for non-matching queries" do
      results = ArticleChunk.search_by_text("JavaScript")
      expect(results).to be_empty
    end
  end
end
