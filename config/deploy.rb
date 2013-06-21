set :application, "gvine"
set :repository,  "https://github.com/jrom/gvine.git"
set :deploy_to, "/home/teambox/apps/gvine"
set :deploy_via, :remote_cache
set :branch, "master"

set :user, "teambox"

set :use_sudo, false
ssh_options[:forward_agent] = true

set :scm, :git

role :web, "gvine.co"
role :app, "gvine.co"
role :db,  "gvine.co", :primary => true

namespace :deploy do
  task :start do ; end
  task :stop do ; end
end

