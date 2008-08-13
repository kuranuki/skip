# SKIP(Social Knowledge & Innovation Platform)
# Copyright (C) 2008 TIS Inc.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.

class Admin::BoardEntryCommentsController < ApplicationController
  before_filter :require_admin, :load_parent
  include AdminModule::AdminChildModule

  private
  def load_parent
    @board_entry ||= Admin::BoardEntry.find(params[:board_entry_id])
  end

  def url_prefix
    'admin_board_entry_'
  end
end