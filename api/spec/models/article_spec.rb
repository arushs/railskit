require "rails_helper"

RSpec.describe Article, type: :model do
  describe "validations" do
    it "requires title" do
      article = Article.new(body: "content")
      expect(article).not_to be_valid
      expect(article.errors[:title]).to include("can't be blank")
    end

    it "requires body" do
      article = Article.new(title: "Test")
      expect(article).not_to be_valid
      expect(article.errors[:body]).to include("can't be blank")
    end

    it "is valid with title and body" do
      article = Article.new(title: "Test", body: "Content here")
      expect(article).to be_valid
    end
  end

  describe "scopes" do
    it ".published returns only published articles" do
      published = Article.create!(title: "Pub", body: "content", published_at: 1.day.ago)
      future = Article.create!(title: "Future", body: "content", published_at: 1.day.from_now)
      draft = Article.create!(title: "Draft", body: "content", published_at: nil)

      expect(Article.published).to include(published)
      expect(Article.published).not_to include(future)
      expect(Article.published).not_to include(draft)
    end
  end

  describe "associations" do
    it "has many article_chunks with dependent destroy" do
      assoc = described_class.reflect_on_association(:article_chunks)
      expect(assoc.macro).to eq(:has_many)
      expect(assoc.options[:dependent]).to eq(:destroy)
    end
  end
end
