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

class Admin::PicturesController < Admin::ApplicationController
  include Admin::AdminModule::AdminRootModule
  include Admin::AdminModule::AdminUtil
  def index
    @query = params[:query]
    @pages, @users = paginate(:users,
                              :per_page => 100,
                              :class_name => 'Admin::User',
                              :conditions => [search_condition, { :lqs => SkipUtil.to_lqs(@query) }])

    @topics = [[_('Listing %{model}') % {:model => _('user')}, admin_users_path],
               [_('Listing %{model}') % {:model => _('picture')}]]

    respond_to do |format|
      format.html # index.html.erb
    end
  end

  def new
    @user = Admin::User.find(params[:user_id])
    @picture = @user.build_picture
    @topics = [[_('Listing %{model}') % {:model => _('user')}, admin_users_path],
               [_('Listing %{model}') % {:model => _('picture')}, admin_pictures_path],
               [_('New %{model}') % {:model => _('picture')}]]
    respond_to do |format|
      format.html # new.html.erb
    end
  end

  def create
    @user = Admin::User.find(params[:user_id])
    @picture = @user.build_picture(params[:admin_picture])
    @topics = [[_('Listing %{model}') % {:model => _('user')}, admin_users_path],
               [_('Listing %{model}') % {:model => _('picture')}, admin_pictures_path],
               [_('New %{model}') % {:model => _('picture')}]]
    respond_to do |format|
      if @picture.save
        flash[:notice] = _("%{model} was successfully created.") % {:model => _('picture')}
        format.html { redirect_to(admin_pictures_path) }
      else
        format.html { render :action => "new" }
      end
    end
  end

  def edit
    @user = Admin::User.find(params[:user_id])
    @picture = @user.picture
    @topics = [[_('Listing %{model}') % {:model => _('user')}, admin_users_path],
               [_('Listing %{model}') % {:model => _('picture')}, admin_pictures_path],
               [_('Editing %{model}') % {:model => _('picture')}]]
    respond_to do |format|
      format.html # edit.html.erb
    end
  end

  def update
    @user = Admin::User.find(params[:user_id])
    @picture = @user.picture
    @picture.attributes = params[:admin_picture]
    @topics = [[_('Listing %{model}') % {:model => _('user')}, admin_users_path],
               [_('Listing %{model}') % {:model => _('picture')}, admin_pictures_path],
               [_('Editing %{model}') % {:model => _('picture')}]]

    respond_to do |format|
      if @picture.save
        flash[:notice] = _("%{model} was successfully updated.") % {:model => _('picture')}
        format.html { redirect_to(admin_pictures_path) }
      else
        format.html { render :action => "edit" }
      end
    end
  end
end
