# frozen_string_literal: true

require "webmock/rspec"

# Allow localhost connections for test server, block all external HTTP
WebMock.disable_net_connect!(allow_localhost: true)
