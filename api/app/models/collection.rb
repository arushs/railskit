# frozen_string_literal: true

class Collection < ApplicationRecord
  belongs_to :user, optional: true
  has_many :documents, dependent: :destroy
  has_many :chunks, through: :documents

  validates :name, presence: true, uniqueness: true
end
