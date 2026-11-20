# Survey Image Assets Required

## Required Files

Please save the survey provider images to these exact locations:

1. **Survey Icon:**
   - Path: `public/icons/icon-survey.png`
   - Description: Survey/checklist icon (green rounded square with checklist and star)

2. **CPX Research Logo:**
   - Path: `public/images/providers/cpxresearch.png`
   - Description: CPX Research provider logo (green checkmark circle)

3. **TheoremReach Logo:**
   - Path: `public/images/providers/theoremreach.png`
   - Description: TheoremReach provider logo (purple survey/clipboard icon)

4. **Timewall Logo:**
   - Path: `public/images/providers/timewall.png`
   - Description: Timewall provider logo (blue/cyan clock with battery bars)

## Usage

These images are used in:
- Survey section header (`/icons/icon-survey.png`)
- Survey card provider chips (`/images/providers/{slug}.png`)
- Both home page and /surveys page

The code has fallback to provider names if images are missing, but images should be added for best UX.
