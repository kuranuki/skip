class RankingController < ApplicationController
  def update
    new_ranking = Ranking.new params[:ranking]
    exisiting_ranking = Ranking.find_by_url_and_extracted_on_and_contents_type_id(new_ranking.url, new_ranking.extracted_on, new_ranking.contents_type_id)
    if exisiting_ranking.empty?
      if new_ranking.save 
        head :created 
      else
        head :bad_request
      end
    else
      if exisiting_ranking.first.add_amount(new_ranking.amount)
        head :ok
      else
        head :bad_request
      end
    end
  end

  # GET /rankings/:content_type/:year/:month
  def index
    if params[:content_type].blank?
      return head :bad_request
    end

    unless params[:year]
      @rankings = Ranking.all_rankings(params[:content_type])
    else
      if params[:month]
        @rankings = Ranking.monthry_rankings(params[:content_type], params[:year], params[:month])
      end
    end
  end
end