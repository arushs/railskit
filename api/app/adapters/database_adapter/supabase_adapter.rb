# frozen_string_literal: true

require "net/http"
require "json"
require "uri"

module DatabaseAdapter
  # Wraps the Supabase PostgREST API.
  # Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
  #
  # This adapter speaks directly to the Supabase REST layer, so no
  # ActiveRecord connection is needed (though you can still use AR
  # alongside it if you point DATABASE_URL at the Supabase Postgres
  # connection string).
  class SupabaseAdapter < Base
    SUPABASE_URL = -> { ENV.fetch("SUPABASE_URL") }
    SUPABASE_KEY = -> { ENV.fetch("SUPABASE_SERVICE_ROLE_KEY") }

    def find(table, id)
      response = request(:get, table, params: { id: "eq.#{id}" })
      rows = parse(response)
      rows.first
    end

    def where(table, conditions = {}, options = {})
      params = conditions.transform_values { |v| "eq.#{v}" }
      params[:limit]  = options[:limit]  if options[:limit]
      params[:offset] = options[:offset] if options[:offset]
      params[:order]  = options[:order]  if options[:order]

      response = request(:get, table, params: params)
      parse(response)
    end

    def create(table, attributes)
      response = request(:post, table, body: attributes, headers: prefer_return)
      rows = parse(response)
      rows.first || attributes.symbolize_keys
    end

    def update(table, id, attributes)
      response = request(:patch, table,
        body: attributes,
        params: { id: "eq.#{id}" },
        headers: prefer_return)
      rows = parse(response)
      rows.first
    end

    def delete(table, id)
      response = request(:delete, table, params: { id: "eq.#{id}" })
      response.is_a?(Net::HTTPSuccess)
    end

    def count(table, conditions = {})
      params = conditions.transform_values { |v| "eq.#{v}" }
      response = request(:get, table, params: params, headers: {
        "Prefer" => "count=exact",
        "Range-Unit" => "items"
      })
      # Supabase returns count in the content-range header.
      range = response["content-range"]
      return 0 unless range

      range.split("/").last.to_i
    end

    def supports_migrations?
      # Supabase uses its own migration system via the dashboard or
      # supabase CLI — we don't run AR migrations against it.
      false
    end

    def execute(_sql)
      raise NotImplementedError, "Raw SQL not supported via Supabase REST API. Use the Supabase SQL editor or connect via DATABASE_URL."
    end

    def connected?
      uri = URI.parse("#{SUPABASE_URL.call}/rest/v1/")
      response = Net::HTTP.get_response(uri)
      response.is_a?(Net::HTTPSuccess) || response.is_a?(Net::HTTPUnauthorized)
    rescue StandardError
      false
    end

    private

    def base_url
      "#{SUPABASE_URL.call}/rest/v1"
    end

    def default_headers
      {
        "apikey" => SUPABASE_KEY.call,
        "Authorization" => "Bearer #{SUPABASE_KEY.call}",
        "Content-Type" => "application/json"
      }
    end

    def prefer_return
      { "Prefer" => "return=representation" }
    end

    def request(method, table, body: nil, params: {}, headers: {})
      uri = URI.parse("#{base_url}/#{table}")
      uri.query = URI.encode_www_form(params) unless params.empty?

      req = case method
            when :get    then Net::HTTP::Get.new(uri)
            when :post   then Net::HTTP::Post.new(uri)
            when :patch  then Net::HTTP::Patch.new(uri)
            when :delete then Net::HTTP::Delete.new(uri)
            else raise ArgumentError, "Unsupported HTTP method: #{method}"
            end

      default_headers.merge(headers).each { |k, v| req[k] = v }
      req.body = body.to_json if body

      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = uri.scheme == "https"
      response = http.request(req)

      unless response.is_a?(Net::HTTPSuccess)
        raise "Supabase API error (#{response.code}): #{response.body}"
      end

      response
    end

    def parse(response)
      return [] if response.body.nil? || response.body.empty?

      data = JSON.parse(response.body, symbolize_names: true)
      data.is_a?(Array) ? data : [ data ]
    end
  end
end
