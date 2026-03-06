# frozen_string_literal: true

module Rag
  # ContentExtractor pulls text from various file types and URLs.
  #
  # Supported file types:
  #   - Plain text (.txt, .md, .csv)
  #   - PDF (via pdf-reader gem if available, otherwise basic extraction)
  #   - HTML (strips tags)
  #
  # Usage:
  #   text = Rag::ContentExtractor.extract(active_storage_blob)
  #   result = Rag::ContentExtractor.extract_url("https://example.com/page")
  #
  class ContentExtractor
    class ExtractionError < StandardError; end

    class << self
      # Extract text from an ActiveStorage attachment
      def extract(attachment)
        content_type = attachment.content_type
        blob = attachment.is_a?(ActiveStorage::Attached::One) ? attachment.blob : attachment

        blob.open do |tempfile|
          case content_type
          when %r{text/plain}, %r{text/markdown}, %r{text/csv}
            tempfile.read.force_encoding("UTF-8")
          when %r{application/pdf}
            extract_pdf(tempfile.path)
          when %r{text/html}
            extract_html(tempfile.read)
          when %r{application/json}
            tempfile.read.force_encoding("UTF-8")
          else
            # Try reading as text, fail gracefully
            content = tempfile.read.force_encoding("UTF-8")
            content.valid_encoding? ? content : raise(ExtractionError, "Unsupported file type: #{content_type}")
          end
        end
      end

      # Extract text from a URL
      def extract_url(url)
        require "net/http"

        uri = URI(url)
        response = Net::HTTP.get_response(uri)
        raise ExtractionError, "Failed to fetch #{url}: #{response.code}" unless response.is_a?(Net::HTTPSuccess)

        content_type = response.content_type

        content = if content_type&.include?("html")
                    extract_html(response.body)
                  else
                    response.body.force_encoding("UTF-8")
                  end

        { content: content, content_type: content_type }
      end

      private

      def extract_pdf(path)
        if defined?(PDF::Reader)
          reader = PDF::Reader.new(path)
          reader.pages.map(&:text).join("\n\n")
        else
          # Fallback: try pdftotext command
          result = `pdftotext "#{path}" - 2>/dev/null`
          raise ExtractionError, "PDF extraction failed. Install pdf-reader gem or pdftotext." if result.empty? && $?.exitstatus != 0
          result
        end
      end

      def extract_html(html)
        # Strip HTML tags, decode entities, normalize whitespace
        text = html.to_s
          .gsub(%r{<script[^>]*>.*?</script>}mi, "")  # Remove scripts
          .gsub(%r{<style[^>]*>.*?</style>}mi, "")     # Remove styles
          .gsub(/<br\s*\/?>/, "\n")                      # BR to newline
          .gsub(/<\/(?:p|div|h[1-6]|li|tr)>/i, "\n\n")  # Block elements to double newline
          .gsub(/<[^>]+>/, "")                           # Strip remaining tags
          .gsub(/&nbsp;/, " ")
          .gsub(/&amp;/, "&")
          .gsub(/&lt;/, "<")
          .gsub(/&gt;/, ">")
          .gsub(/&quot;/, '"')
          .gsub(/&#39;/, "'")
          .gsub(/\n{3,}/, "\n\n")                        # Normalize newlines
          .strip

        text
      end
    end
  end
end
