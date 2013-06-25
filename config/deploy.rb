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

set :normal_symlinks, %w(
  gif
  tmp
)

namespace :symlinks do
  desc "Make all the damn symlinks"
  task :make, :roles => :app, :except => { :no_release => true } do
    commands = normal_symlinks.map do |path|
      "rm -rf #{release_path}/#{path} && \
       ln -s #{shared_path}/#{path} #{release_path}/#{path}"
    end

    run <<-CMD
      cd #{release_path} &&
      #{commands.join(" && ")}
    CMD
  end
end

after "deploy:update_code", "symlinks:make"

