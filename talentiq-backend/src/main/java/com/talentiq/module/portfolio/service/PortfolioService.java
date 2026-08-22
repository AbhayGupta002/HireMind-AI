package com.talentiq.module.portfolio.service;

import com.talentiq.common.response.PagedResponse;
import com.talentiq.module.portfolio.dto.PortfolioDto;
import org.springframework.data.domain.Pageable;

public interface PortfolioService {

    PortfolioDto.Response createPortfolio(Long candidateUserId, PortfolioDto.CreateRequest request);

    PortfolioDto.Response updatePortfolio(Long candidateUserId, Long portfolioId, PortfolioDto.UpdateRequest request);

    void deletePortfolio(Long candidateUserId, Long portfolioId);

    PortfolioDto.Response getPortfolioById(Long portfolioId);

    PagedResponse<PortfolioDto.Response> listPortfoliosByCandidate(Long candidateId, Pageable pageable);

    PagedResponse<PortfolioDto.Response> listPortfoliosByCandidateUserId(Long candidateUserId, Pageable pageable);
}
