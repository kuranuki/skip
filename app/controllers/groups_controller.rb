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

class GroupsController < ApplicationController
  before_filter :setup_layout

  verify :method => :post, :only => [ :create ],
          :redirect_to => { :action => :index }

  # tab_menu
  # グループの一覧表示
  def index
    params[:yet_participation] ||= false
    params[:category] ||= "all"
    params[:sort_type] ||= "date"
    @format_type = params[:format_type] ||= "detail"
    @group_counts, @total_count = Group.count_by_category

    options = Group.paginate_option(session[:user_id], params)
    options[:per_page] = params[:format_type] == "list" ? 2 : 2 # 30 : 5
    @pages, @groups = paginate(:group, options)

    unless @groups && @groups.size > 0
      flash.now[:notice] = '該当するグループはありませんでした。'
    end
  end

  # tab_menu
  # グループの新規作成画面の表示
  def new
    @group = Group.new
    render(:partial => "group/form", :layout => 'layout',
            :locals => { :action_value => 'create', :submit_value => '作成' } )
  end

  # post_action
  # グループの新規作成の処理
  def create
    @group = Group.new(params[:group])
    @group.group_participations.build(:user_id => session[:user_id], :owned => true)

    if @group.save
      flash[:notice] = 'グループが正しく作成されました。'
      redirect_to :controller => 'group', :action => 'show', :gid => @group.gid
    else
      render(:partial => "group/form", :layout => 'layout',
              :locals => { :action_value => 'create', :submit_value => '作成' } )
    end
  end

  # component
  def list
    if not parent_controller
      flash[:warning] = '不正な操作でのアクセスは許可されていません'
      redirect_to :controller => 'mypage', :action => "index"
      return
    end

    params[:page] = parent_controller.params[:page]
    params[:participation] = true
    show_user_id = parent_controller.params[:user_id]
    params[:keyword] = parent_controller.params[:keyword]
    params[:category] = parent_controller.params[:category]
    @format_type = params[:format_type] = parent_controller.params[:format_type]
    params[:sort_type] = parent_controller.params[:sort_type] || "date"

    options = Group.paginate_option(show_user_id, params)
    options[:per_page] = params[:format_type] == "list" ? 2 : 2 # 30 : 5
    @pages, @groups = paginate(:group, options)

    unless @groups && @groups.size > 0
      flash.now[:notice] = '該当するグループはありませんでした。'
    end

    params[:controller] = parent_controller.params[:controller]
    params[:action] = parent_controller.params[:action]

    render :partial => 'groups', :object => @groups, :locals => { :pages => @pages,
                                                                  :user_id => params[:user_id],
                                                                  :show_favorite => (show_user_id == session[:user_id]) }
  end

private
  def setup_layout
    @main_menu = @title = 'グループ'

    @tab_menu_source = [ ['グループの検索', 'index'],
                         ['グループの新規作成', 'new'] ]
  end
end
