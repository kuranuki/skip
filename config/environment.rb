# Be sure to restart your web server when you modify this file.

# Uncomment below to force Rails into production mode
# (Use only when you can't set environment variables through your web/app server)
ENV['RAILS_ENV'] ||= 'production'

RAILS_GEM_VERSION = '2.1.2' unless defined? RAILS_GEM_VERSION

SKIP_VERSION = '1.1.0'

# Bootstrap the Rails environment, frameworks, and default configuration
require File.join(File.dirname(__FILE__), 'boot')


Rails::Initializer.run do |config|
  # TODO: Rails 2.3 にバージョンアップする際に独自でyamlをパースすることを無くす
  require 'yaml'
  config.action_controller.session = YAML.load(File.read(RAILS_ROOT + "/config/initial_settings.yml"))[RAILS_ENV]['session']
  # config.action_controller.session_store = :p_store

  # Skip frameworks you're not going to use
  # config.frameworks -= [ :action_web_service, :action_mailer ]

  # Add additional load paths for your own custom dirs
  # config.load_paths += %W( #{RAILS_ROOT}/extras )

  # Force all environments to use the same logger level
  # (by default production uses :info, the others :debug)
  # config.log_level = :debug

  # Use the database for sessions instead of the file system
  # (create the session table with 'rake create_sessions_table')
  # config.action_controller.session_store = :active_record_store

  # Enable page/fragment caching by setting a file-based store
  # (remember to create the caching directory and make it readable to the application)
  # config.action_controller.fragment_cache_store = :file_store, "#{RAILS_ROOT}/cache"

  # Activate observers that should always be running
  # config.active_record.observers = :cacher, :garbage_collector

  # Make Active Record use UTC-base instead of local time
  # config.active_record.default_timezone = :utc

  # Use Active Record's schema dumper instead of SQL when creating the test database
  # (enables use of different database adapters for development and test environments)
  # config.active_record.schema_format = :ruby

  # See Rails::Configuration for more options
  config.gem 'gettext',  :lib => 'gettext/rails', :version => '1.93.0'
  config.gem "json", :lib => "json/add/rails"
  config.gem "fastercsv"
  config.gem 'openskip-skip_embedded', :lib => 'skip_embedded', :version => '>=0.9.9', :source => 'http://gems.github.com'
end

menu_btns = [
             { :img_name => "house",
               :id => "btn_mypage",
               :name => GetText.N_("My Page"),
               :url => {:controller => '/mypage', :action => 'index'},
               :desc => GetText.N_("Back to mypage.")},

             { :img_name => "report",
               :id => "btn_entries",
               :name => GetText.N_("Entries"),
               :url => {:controller => '/search', :action => 'entry_search' },
               :desc => GetText.N_("Search entries.")},

             { :img_name => "disk_multiple",
               :id => "btn_share_files",
               :name => GetText.N_("Files"),
               :url => {:controller => '/search', :action => 'share_file_search' },
               :desc => GetText.N_("Search share files.")},

             { :img_name => "user_suit",
               :id => "btn_users",
               :name => GetText.N_("Users"),
               :url => {:controller => '/users', :action => 'index'},
               :desc => GetText.N_("Search users.")},

             { :img_name => "group",
               :id => "btn_groups",
               :name => GetText.N_("Groups"),
               :url => {:controller => '/groups', :action => 'index'},
               :desc => GetText.N_("Search groups.")},

             { :img_name => "tag_blue",
               :id => "btn_bookmarks",
               :name => GetText.N_("Bookmarks"),
               :url => {:controller => '/bookmarks', :action => 'index'},
               :desc => GetText.N_("Search bookmarks.")},

             { :img_name => "chart_bar",
               :id => "btn_rankings",
               :name => GetText.N_("Rankings"),
               :url => {:controller => '/rankings', :action => 'index'},
               :desc => GetText.N_("Show ranking and site infomation.")}
]

menu_btns << { :img_name => "page_find",
               :id => "btn_search",
               :name => GetText.N_("Search for Data"),
               :url => {:controller => '/search', :action => 'full_text_search' },
               :desc => GetText.N_("Search contents of the site by keyword.") } if SkipEmbedded::InitialSettings['full_text_search_setting']
MENU_BTNS = menu_btns

admin_btns = [
  {:img_name => "database_gear",
   :id => "btn_admin",
   :name => GetText.N_("System Administration"),
   :url => {:controller => '/admin', :action => 'index'},
   :desc => GetText.N_("Administration of the site.") }
]
ADMIN_MENU_BTNS = admin_btns

# 共通メニュー
common_menu_path = File.join(RAILS_ROOT, 'config', 'common_menus.yml')
COMMON_MENUS = File.exist?(common_menu_path) ? YAML::load(File.open(File.join(RAILS_ROOT, 'config', 'common_menus.yml'))) : {}

# 祝日マスタ
HOLIDAYS = YAML::load(File.open(File.join(RAILS_ROOT, 'config', 'holiday.yml')))

require 'hikidoc'
require 'skip_util'
