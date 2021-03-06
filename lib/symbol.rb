# SKIP(Social Knowledge & Innovation Platform)
# Copyright (C) 2008-2009 TIS Inc.
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

class Symbol

  SYSTEM_ALL_USER = "sid:allusers"

  # symbolをtypeとid部分に分ける
  def self.split_symbol symbol
    symbol_type = symbol.split(":").first
    symbol_id   = symbol.split(":").last
    return symbol_type, symbol_id
  end

  # symbolからオブジェクト(User,Groupのどれか)を取り出す
  def self.get_item_by_symbol symbol
    symbol_type, symbol_id = split_symbol symbol
    item = nil
    case symbol_type
    when "uid"
      item = User.find_by_uid(symbol_id)
    when "gid"
      item = Group.active.find_by_gid(symbol_id)
    end
    return item
  end

  # symbolで示されるオブジェクト（user/group）が全体公開か否か
  def self.public_symbol_obj? symbol
    symbol_type, symbol_id = Symbol.split_symbol symbol
    case symbol_type
      when "gid"
        # TODO グループの公開範囲指定実装後に修正 <- のコメントの意味がわからない。要調査
    end
    return true
  end

  def self.to_symbol_type(type)
    { 'system' => 'sid', 'user' => 'uid', 'group' => 'gid' }[type]
  end

  def self.items_by_partial_match_symbol_or_name search_query
    return [] if search_query.blank?
    items = []
    symbol_type, symbol_id = Symbol.split_symbol search_query
    case symbol_type
    when "uid" then items = User.partial_match_uid(symbol_id)
    when "gid" then items = Group.active.partial_match_gid(symbol_id)
    else
      items = User.partial_match_uid_or_name(search_query)
      items.concat(Group.active.partial_match_gid_or_name(search_query))
    end
    items
  end
end
