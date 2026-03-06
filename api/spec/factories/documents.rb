# frozen_string_literal: true

FactoryBot.define do
  factory :document do
    name { "test_doc.txt" }
    content_type { "text/plain" }
    size { 1024 }
    status { "processing" }
    document_collection
    user

    trait :ready do
      status { "ready" }
    end

    trait :error do
      status { "error" }
      error_message { "Processing failed" }
    end

    trait :with_file do
      after(:build) do |doc|
        doc.file.attach(
          io: StringIO.new("Sample document content for testing."),
          filename: doc.name,
          content_type: doc.content_type
        )
      end
    end
  end
end
