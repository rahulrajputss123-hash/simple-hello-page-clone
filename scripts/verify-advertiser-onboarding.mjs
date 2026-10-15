import assert from "node:assert/strict";

const content = (overview) => {
  const eligible =
    overview.promoActive && overview.lifetimeDeposited === 0 && overview.userBonusPercent > 0;
  const bonus = Math.round(overview.minDepositUsd * overview.userBonusPercent) / 100;
  return {
    eligible,
    title: eligible ? "Get More Campaign Credit" : "Build Your Next Campaign",
    bonus,
  };
};

assert.equal(
  content({ promoActive: true, lifetimeDeposited: 0, userBonusPercent: 50, minDepositUsd: 100 })
    .eligible,
  true,
);
assert.equal(
  content({ promoActive: true, lifetimeDeposited: 0, userBonusPercent: 50, minDepositUsd: 100 })
    .bonus,
  50,
);
assert.equal(
  content({ promoActive: true, lifetimeDeposited: 0, userBonusPercent: 100, minDepositUsd: 25 })
    .bonus,
  25,
);
assert.equal(
  content({ promoActive: false, lifetimeDeposited: 0, userBonusPercent: 100, minDepositUsd: 25 })
    .title,
  "Build Your Next Campaign",
);
assert.equal(
  content({ promoActive: true, lifetimeDeposited: 1, userBonusPercent: 100, minDepositUsd: 25 })
    .eligible,
  false,
);
console.log("advertiser onboarding eligibility checks: 5 passed");
