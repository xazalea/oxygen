/**
 * Investment Valuation Calculator
 * 
 * Calculates post valuation based on investments, engagement, and time decay.
 */

export interface ValuationInputs {
  totalInvested: number
  views: number
  likes: number
  shares: number
  comments: number
  postAgeHours: number
  creatorReputation: number // 0-1 scale
}

export interface ValuationResult {
  baseValuation: number
  engagementMultiplier: number
  timeDecayFactor: number
  creatorReputationFactor: number
  currentValuation: number
}

export class ValuationCalculator {
  /**
   * Calculate current post valuation
   */
  calculateValuation(inputs: ValuationInputs): ValuationResult {
    // Base valuation starts with total invested
    const baseValuation = inputs.totalInvested

    // Engagement multiplier
    // Formula: (views * 0.1 + likes * 1 + shares * 2 + comments * 1.5) / 1000
    const engagementScore = 
      (inputs.views * 0.1) +
      (inputs.likes * 1) +
      (inputs.shares * 2) +
      (inputs.comments * 1.5)
    
    const engagementMultiplier = 1 + (engagementScore / 1000)

    // Time decay factor
    // Decay over 1 week (168 hours), max 30% decay
    const timeDecayFactor = Math.max(0.7, 1 - (inputs.postAgeHours / 168) * 0.3)

    // Creator reputation factor (0.8 to 1.2)
    const creatorReputationFactor = 0.8 + (inputs.creatorReputation * 0.4)

    // Current valuation
    const currentValuation = baseValuation * engagementMultiplier * timeDecayFactor * creatorReputationFactor

    return {
      baseValuation,
      engagementMultiplier,
      timeDecayFactor,
      creatorReputationFactor,
      currentValuation: Math.max(0, currentValuation)
    }
  }

  /**
   * Calculate early investor bonus
   */
  calculateEarlyBonus(investmentTime: number, postAge: number): number {
    if (postAge === 0) return 1.5 // Maximum bonus for first investor
    
    const timeRatio = investmentTime / postAge
    // Early bonus: 1 + (1 - timeRatio) * 0.5
    // First investor gets 1.5x, later investors get less
    return 1 + (1 - Math.min(1, timeRatio)) * 0.5
  }

  /**
   * Calculate return multiplier
   */
  calculateReturnMultiplier(
    initialValuation: number,
    currentValuation: number,
    earlyBonus: number
  ): number {
    if (initialValuation === 0) return 1
    
    const valuationMultiplier = currentValuation / initialValuation
    return valuationMultiplier * earlyBonus
  }

  /**
   * Calculate return amount for an investment
   */
  calculateReturn(
    investmentAmount: number,
    initialValuation: number,
    currentValuation: number,
    investmentTime: number,
    postAge: number
  ): number {
    const earlyBonus = this.calculateEarlyBonus(investmentTime, postAge)
    const returnMultiplier = this.calculateReturnMultiplier(
      initialValuation,
      currentValuation,
      earlyBonus
    )
    
    return investmentAmount * returnMultiplier
  }

  /**
   * Calculate ROI percentage
   */
  calculateROI(investmentAmount: number, returnAmount: number): number {
    if (investmentAmount === 0) return 0
    return ((returnAmount - investmentAmount) / investmentAmount) * 100
  }
}

// Singleton instance
let valuationCalculatorInstance: ValuationCalculator | null = null

export function getValuationCalculator(): ValuationCalculator {
  if (!valuationCalculatorInstance) {
    valuationCalculatorInstance = new ValuationCalculator()
  }
  return valuationCalculatorInstance
}



