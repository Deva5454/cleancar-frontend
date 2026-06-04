/**
 * Incentive Rule Builder (Configuration Engine)
 *
 * Comprehensive incentive configuration system replacing the simple rule builder.
 * Allows HR/Finance admins to configure incentive rules per role with full approval workflow.
 *
 * @component
 */

import IncentiveConfiguration from "../incentives/IncentiveConfiguration";

export function IncentiveRuleBuilder() {
  return <IncentiveConfiguration />;
}
