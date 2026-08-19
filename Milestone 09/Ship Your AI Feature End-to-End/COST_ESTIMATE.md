# Code Context Companion — Cost Estimate

## Feature

**Name:** Code Context Companion

**Problem solved:** I wanted a faster way to turn a code change into an explanation and review checklist I could confidently share.

## Planning token estimate

The assignment requires the arithmetic to be visible. The following estimate uses five representative short analyses rather than reporting a final number without its inputs.

| Representative call | Prompt tokens | Completion tokens | Total tokens |
| --- | ---: | ---: | ---: |
| 1 | 600 | 400 | 1,000 |
| 2 | 600 | 400 | 1,000 |
| 3 | 600 | 400 | 1,000 |
| 4 | 600 | 400 | 1,000 |
| 5 | 600 | 400 | 1,000 |
| **Average** | **600** | **400** | **1,000** |

## Model pricing used for the estimate

| Item | Rate |
| --- | ---: |
| Model | `openai/gpt-4o-mini` |
| Input tokens | `$0.15` per 1,000,000 tokens |
| Output tokens | `$0.60` per 1,000,000 tokens |

## Cost per request

```text
(600 / 1,000,000 × $0.15) + (400 / 1,000,000 × $0.60)
= $0.000090 + $0.000240
= $0.000330 per analysis
```

## Monthly projection

```text
Expected monthly calls = 300
Monthly AI total = 300 × $0.000330
                 = $0.099
                 ≈ $0.10/month
```

This is model usage only. The assignment assumes free-tier hosting for the demonstration, so hosting is budgeted at `$0` at this usage level. Actual spend should be recalculated from provider usage logs after deployment.

## Rate-limit cost check

```text
20 analyses/hour × $0.000330/analysis = $0.0066 maximum per client per hour
```

The backend enforces this limit with an `X-Client-Id` key and returns HTTP 429 after the hourly allowance is exhausted.
