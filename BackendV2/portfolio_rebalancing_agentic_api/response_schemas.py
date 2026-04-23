"""
response_schemas.py
Pydantic models defining the exact JSON contract for the 6 rebalancing APIs.
These mirror the output shapes from portfolio_rebalancing/server.py.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# ── Client Detail ─────────────────────────────────────────────────────────────
class ClientInfo(BaseModel):
    client_id: str = ""
    name: str = ""
    age: int = 0
    risk_tolerance: str = ""
    fum: str = ""
    Cash_in_Hand: str = ""

class AssetAllocation(BaseModel):
    category: str
    current: float
    target: float
    rebalanced: float = 0.0

class FundDrift(BaseModel):
    ticker: str
    actual: float
    target: float
    drift: float

class RiskSummaryItem(BaseModel):
    title: str
    detail: str
    type: str = "risk"

class KPI(BaseModel):
    portfolio_value: str = ""
    positions_to_fix: int = 0
    trade_recos: int = 0
    expected_benefit: str = ""

class RecommendedOption(BaseModel):
    name: str = ""
    description: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)

class Recommendations(BaseModel):
    kpi: KPI = Field(default_factory=KPI)
    recommended_option: RecommendedOption = Field(default_factory=RecommendedOption)

class ClientDetailData(BaseModel):
    client: ClientInfo = Field(default_factory=ClientInfo)
    asset_allocation: List[AssetAllocation] = Field(default_factory=list)
    fund_drift: List[FundDrift] = Field(default_factory=list)
    risk_summary: List[RiskSummaryItem] = Field(default_factory=list)
    recommendations: Recommendations = Field(default_factory=Recommendations)


# ── Risk Analysis ─────────────────────────────────────────────────────────────
class AssetDriftRow(BaseModel):
    asset_class: str = Field(alias="class", default="")
    actual: float = 0.0
    target: float = 0.0
    diff: float = 0.0
    band: str = ""
    status: str = "OK"

    class Config:
        populate_by_name = True

class VolatilityRow(BaseModel):
    tier: str = ""
    fund: str = ""
    std_dev: str = ""
    var_95: str = ""
    weight: str = ""
    risk_contrib: str = ""

class BetaRow(BaseModel):
    fund: str = ""
    beta: float = 0.0
    weight: str = ""
    contribution: float = 0.0

class DrawdownRow(BaseModel):
    fund: str = ""
    max_dd: str = ""
    var_95: str = ""
    note: str = ""

class SectorRow(BaseModel):
    fund: str = ""
    it_pct: str = ""
    eq_weight: str = ""
    it_contrib: str = ""

class RiskDashboardRow(BaseModel):
    metric: str = ""
    current: str = ""
    target: str = ""
    variance: str = ""
    action: str = ""

class RiskInsights(BaseModel):
    drift: List[str] = Field(default_factory=list)
    volatility: List[str] = Field(default_factory=list)
    beta: List[str] = Field(default_factory=list)
    sector: List[str] = Field(default_factory=list)
    drawdown: List[str] = Field(default_factory=list)
    sentiment: List[str] = Field(default_factory=list)
    dashboard: List[str] = Field(default_factory=list)

class RiskAnalysisData(BaseModel):
    portfolio_beta: float = 0.0
    target_beta: float = 0.75
    volatility_1y_pct: float = 0.0
    sharpe_1y: float = 0.0
    total_it_concentration: float = 0.0
    asset_drift: List[AssetDriftRow] = Field(default_factory=list)
    fund_drift: List[FundDrift] = Field(default_factory=list)
    volatility: List[VolatilityRow] = Field(default_factory=list)
    beta_exposure: List[BetaRow] = Field(default_factory=list)
    drawdown_risk: List[DrawdownRow] = Field(default_factory=list)
    sector_concentration: List[SectorRow] = Field(default_factory=list)
    risk_dashboard: List[RiskDashboardRow] = Field(default_factory=list)
    insights: RiskInsights = Field(default_factory=RiskInsights)


# ── Investment Details ────────────────────────────────────────────────────────
class SentimentAnalysis(BaseModel):
    sentiment: str = ""
    market_impact: str = ""

class Article(BaseModel):
    headline: str = ""
    summary: str = ""
    formatted_date: str = ""
    url: str = ""
    sentiment_analysis: SentimentAnalysis = Field(default_factory=SentimentAnalysis)

class SentimentSummary(BaseModel):
    dominant_sentiment: str = ""
    avg_polarity: float = 0.0
    sentiment_distribution: Dict[str, int] = Field(default_factory=dict)

class FundNewsData(BaseModel):
    total_articles: int = 0
    sentiment_summary: SentimentSummary = Field(default_factory=SentimentSummary)
    articles: List[Article] = Field(default_factory=list)

class HoldingRow(BaseModel):
    ticker: str = ""
    name: str = ""
    current_price: float = 0.0
    total_return_pct: float = 0.0
    volatility_pct: float = 0.0
    max_drawdown_pct: float = 0.0

class InvestmentDetailsData(BaseModel):
    current_holdings: List[HoldingRow] = Field(default_factory=list)
    detailed_news_data: Dict[str, FundNewsData] = Field(default_factory=dict)


# ── Rebalancing Action ────────────────────────────────────────────────────────
class RebalanceSummaryRow(BaseModel):
    asset_class: str = ""
    ticker: str = ""
    before: str = ""
    target: str = ""
    after: str = ""
    change: str = ""
    trade_value: str = ""
    direction: str = ""

class TradeReco(BaseModel):
    action: str = ""
    ticker: str = ""
    fund: str = ""
    type: str = ""
    units: int = 0
    amount: float = 0.0
    gain: float = 0.0
    best_lot: Optional[str] = None

class TradeTotals(BaseModel):
    total_sells: float = 0.0
    total_buys: float = 0.0
    net_value: float = 0.0

class RebalanceOption(BaseModel):
    name: str = ""
    description: str = ""
    recommended: bool = False
    trade_totals: TradeTotals = Field(default_factory=TradeTotals)
    trade_recommendations: List[TradeReco] = Field(default_factory=list)

class TaxEfficiency(BaseModel):
    estimated_realized_gains: float = 0.0
    long_term_gains: float = 0.0
    tax_rate_applied: str = ""
    estimated_tax_liability: float = 0.0
    note: str = ""

class CostAnalysis(BaseModel):
    current_weighted_er: str = ""
    post_rebalance_er: str = ""
    annual_savings: str = ""
    note: str = ""

class PostTradeCheck(BaseModel):
    check: str = ""
    status: str = ""
    result: str = ""

class FinalRecommendation(BaseModel):
    option: str = ""
    title: str = ""
    reasons: List[str] = Field(default_factory=list)

class RebalancingActionData(BaseModel):
    rebalance_summary: List[RebalanceSummaryRow] = Field(default_factory=list)
    options: Dict[str, RebalanceOption] = Field(default_factory=dict)
    trade_rationale: str = ""
    tax_efficiency: TaxEfficiency = Field(default_factory=TaxEfficiency)
    cost_analysis: CostAnalysis = Field(default_factory=CostAnalysis)
    post_trade_checks: List[PostTradeCheck] = Field(default_factory=list)
    final_recommendation: FinalRecommendation = Field(default_factory=FinalRecommendation)


# ── Full Analysis Summary ─────────────────────────────────────────────────────
class FullAnalysisSummary(BaseModel):
    client_id: str = ""
    client_name: str = ""
    total_aum: float = 0.0
    risk_profile: str = ""
    priority: str = "MEDIUM"
    priority_reason: str = ""
    action_rationale: str = ""
    compliance_status: str = ""
    rebalance_needed: bool = False
    ips_violations: int = 0
    total_trades: int = 0
    total_buy: float = 0.0
    total_sell: float = 0.0
    estimated_tax: float = 0.0
    portfolio_beta: float = 0.0
    volatility_1y: float = 0.0
    sharpe_1y: float = 0.0
    overall_sentiment: float = 0.0
    risk_score: float = 0.0
    generated_at: str = ""
    cache_hit: bool = False


# ── Worklist ──────────────────────────────────────────────────────────────────
class PriorityInfo(BaseModel):
    level: int = 4
    label: str = "Low"
    color: str = "#22c55e"
    description: str = ""

class TriggerInfo(BaseModel):
    reason: str = ""
    drift_score: float = 0.0
    rebalance_needed: bool = False

class NextBestAction(BaseModel):
    action_label: str = ""
    action_url: str = ""
    requires_approval: bool = False

class ClientMetrics(BaseModel):
    equity_weight: float = 0.0
    bond_weight: float = 0.0
    volatility_1y: float = 0.0
    sharpe_1y: float = 0.0

class WorklistClient(BaseModel):
    client_id: str = ""
    client_name: str = ""
    aum: float = 0.0
    aum_formatted: str = ""
    risk_profile: str = ""
    priority: PriorityInfo = Field(default_factory=PriorityInfo)
    trigger: TriggerInfo = Field(default_factory=TriggerInfo)
    next_best_action: NextBestAction = Field(default_factory=NextBestAction)
    metrics: ClientMetrics = Field(default_factory=ClientMetrics)

class WorklistSummaryStats(BaseModel):
    total_clients: int = 0
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    total_aum: float = 0.0
