# frozen_string_literal: true

class EnablePgvector < ActiveRecord::Migration[8.1]
  def up
    execute "CREATE EXTENSION IF NOT EXISTS vector"
  end

  def down
    execute "DROP EXTENSION IF EXISTS vector"
  end
end
