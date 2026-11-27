/**
 * Content for sponsor PTC landing pages
 * Content varies by content_key: special_missions, marketplace, surveys_offers
 */

export type PtcContent = {
  heroTitle: string;
  heroBenefit: string;
  features: Array<{
    title: string;
    description: string;
  }>;
  howItWorks: Array<{
    step: string;
    description: string;
  }>;
  termsTitle?: string;
  termsItems?: Array<{
    label: string;
    value: string;
  }>;
};

export const PTC_CONTENT: Record<
  "special_missions" | "marketplace" | "surveys_offers",
  PtcContent
> = {
  special_missions: {
    heroTitle: "Special Missions Complete Karo",
    heroBenefit: "Asaan tasks karo aur rewards jeetho",
    features: [
      {
        title: "Daily Missions",
        description: "Roz naye missions milte hain jo aap apne time pe complete kar sakte ho",
      },
      {
        title: "Instant Rewards",
        description: "Mission complete hone pe turant wallet me paise credit ho jate hain",
      },
      {
        title: "Simple Tasks",
        description: "Koi technical knowledge nahi chahiye, sirf instructions follow karo",
      },
      {
        title: "Track Progress",
        description: "App me dekho ki kitne missions complete hue aur kitne baaki hain",
      },
    ],
    howItWorks: [
      {
        step: "Mission kholo",
        description: "Neeche sponsor button pe tap karo aur mission page khul jayega",
      },
      {
        step: "Task complete karo",
        description: "Mission ke instructions padho aur simple task complete karo",
      },
      {
        step: "Reward pao",
        description: "Wapas aao, progress check hoga aur reward automatically add hoga",
      },
    ],
  },
  marketplace: {
    heroTitle: "Marketplace Pe Deposit Karo",
    heroBenefit: "Pehli baar 100% bonus pao",
    features: [
      {
        title: "100% Deposit Bonus",
        description: "Pehli deposit pe aapko double paise milte hain marketplace balance me",
      },
      {
        title: "Instant Deposit",
        description: "UPI ya card se payment karo, turant balance credit hota hai",
      },
      {
        title: "Special Offers",
        description: "Marketplace exclusive offers se zyada paisa kamao",
      },
      {
        title: "Safe & Secure",
        description: "Payment gateway encrypted hai, aapka paisa bilkul safe hai",
      },
    ],
    howItWorks: [
      {
        step: "Marketplace kholo",
        description: "Neeche button pe tap karke marketplace page kholein",
      },
      {
        step: "Pehli deposit karo",
        description: "Jitna deposit karoge utna hi bonus milega (100%)",
      },
      {
        step: "Offers complete karo",
        description: "Marketplace balance se offers karo aur withdraw karo",
      },
    ],
    termsTitle: "Bonus Terms & Conditions",
    termsItems: [
      { label: "Minimum Deposit", value: "₹100 (placeholder - will be updated)" },
      { label: "Bonus Validity", value: "30 days (placeholder - will be updated)" },
      {
        label: "Withdrawal Condition",
        value: "5x turnover required (placeholder - will be updated)",
      },
    ],
  },
  surveys_offers: {
    heroTitle: "Surveys, Quests Aur Offers",
    heroBenefit: "Teen tareekon se kamao - choose karo jo pasand ho",
    features: [
      {
        title: "Paid Surveys",
        description:
          "Apni opinion share karo, 5-15 minute lagte hain. Payout survey complete hone pe milta hai.",
      },
      {
        title: "Daily Quests",
        description:
          "App quests daily refresh hote hain. 2-10 minute me complete karo. Instant reward milta hai.",
      },
      {
        title: "Manual Offers",
        description:
          "App install, trials, signups - choose karo. Approval me 1-3 din lag sakte hain offer type pe depend karke.",
      },
      {
        title: "Flexible Time",
        description: "Jab chahiye tab karo - koi fixed schedule nahi hai",
      },
    ],
    howItWorks: [
      {
        step: "Category chuno",
        description: "Survey, quest ya offer - jo aapko pasand ho wo type select karo",
      },
      {
        step: "Task complete karo",
        description: "Instructions follow karo aur task pura karo",
      },
      {
        step: "Payout pao",
        description:
          "Surveys instant, quests instant, offers 1-3 din me approve hoke credit hote hain",
      },
    ],
  },
};
