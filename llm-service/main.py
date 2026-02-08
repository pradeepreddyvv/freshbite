from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="FreshBite LLM Service")


class ReviewData(BaseModel):
    id: str
    rating: int
    text: str
    createdAt: str


class ChatRequest(BaseModel):
    dishAtRestaurantId: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1, max_length=500)
    window: str = Field(default="24h")
    dishName: str = Field(default="this dish")
    reviews: list[ReviewData] = Field(default_factory=list)


class ChatResponse(BaseModel):
    answer: str
    reviewIdsUsed: list[str]
    window: str
    metadata: dict


def analyze_reviews(question: str, reviews: list[ReviewData], dish_name: str, window: str) -> ChatResponse:
    """Analyze reviews to answer the user's question using keyword matching and aggregation."""
    if not reviews:
        return ChatResponse(
            answer=f"No reviews found for {dish_name} in the last {window}. Be the first to leave a review!",
            reviewIdsUsed=[],
            window=window,
            metadata={"reviewsAnalyzed": 0},
        )

    total = len(reviews)
    avg_rating = sum(r.rating for r in reviews) / total
    five_star = sum(1 for r in reviews if r.rating == 5)
    four_star = sum(1 for r in reviews if r.rating == 4)
    three_star = sum(1 for r in reviews if r.rating == 3)
    low_reviews = [r for r in reviews if r.rating <= 2]
    high_reviews = [r for r in reviews if r.rating >= 4]

    question_lower = question.lower()
    used_ids: list[str] = []

    food_keywords = [
        "spice", "spicy", "hot", "mild", "flavor", "taste", "fresh", "portion",
        "chicken", "rice", "sauce", "tender", "dry", "overcooked", "undercooked",
        "salty", "sweet", "oily", "greasy", "crispy", "soggy", "cold", "warm",
        "biryani", "curry", "naan", "tandoori", "masala", "paneer", "tikka",
        "price", "worth", "expensive", "cheap", "value", "cost",
        "wait", "time", "slow", "fast", "quick", "delivery",
        "service", "staff", "waiter", "ambiance", "clean",
        "best", "great", "good", "bad", "worst", "amazing", "terrible",
        "recommend", "consistent", "quality",
    ]

    keywords_to_search: list[str] = []
    for word in food_keywords:
        if word in question_lower:
            keywords_to_search.append(word)

    relevant_reviews: list[ReviewData] = []
    if keywords_to_search:
        for review in reviews:
            text_lower = review.text.lower()
            if any(kw in text_lower for kw in keywords_to_search):
                relevant_reviews.append(review)
                used_ids.append(review.id)
    else:
        relevant_reviews = reviews
        used_ids = [r.id for r in reviews]

    parts: list[str] = []

    is_recommendation = any(w in question_lower for w in ["best", "great", "recommend", "good", "worth", "should", "how is", "how's"])
    is_negative_check = any(w in question_lower for w in ["bad", "worst", "avoid", "problem", "issue", "complaint", "risky"])
    is_consistency = any(w in question_lower for w in ["consistent", "always", "every time", "reliability", "reliable"])

    if is_recommendation:
        if avg_rating >= 4.0:
            parts.append(
                f"**{dish_name} is highly rated!** Based on {total} recent reviews "
                f"(last {window}), it has an average rating of {avg_rating:.1f}/5."
            )
            if five_star > 0:
                parts.append(f"{five_star} out of {total} reviewers gave it 5 stars.")
            if high_reviews:
                top = max(high_reviews, key=lambda r: r.rating)
                parts.append(f'\n> *"{top.text[:150]}"* — ⭐{top.rating}/5')
        elif avg_rating >= 3.0:
            parts.append(
                f"**{dish_name} has mixed reviews.** Average rating: {avg_rating:.1f}/5 "
                f"from {total} reviews in the last {window}."
            )
        else:
            parts.append(
                f"**Heads up — {dish_name} has low ratings recently.** "
                f"Average: {avg_rating:.1f}/5 from {total} reviews."
            )

    elif is_negative_check:
        if low_reviews:
            parts.append(f"Found {len(low_reviews)} negative review(s) out of {total} in the last {window}:")
            for r in low_reviews[:3]:
                parts.append(f'\n> *"{r.text[:120]}"* — ⭐{r.rating}/5')
        else:
            parts.append(
                f"No negative reviews found for {dish_name} in the last {window}. "
                f"All {total} reviews are positive (avg {avg_rating:.1f}/5)! 🎉"
            )

    elif is_consistency:
        ratings = [r.rating for r in reviews]
        min_r, max_r = min(ratings), max(ratings)
        if max_r - min_r <= 1:
            parts.append(
                f"**{dish_name} is very consistent!** All {total} recent ratings are "
                f"between {min_r} and {max_r} stars (avg {avg_rating:.1f}/5)."
            )
        else:
            parts.append(
                f"**Quality varies.** Ratings range from {min_r} to {max_r} stars "
                f"(avg {avg_rating:.1f}/5) across {total} reviews."
            )

    elif keywords_to_search and relevant_reviews:
        kw_str = ", ".join(keywords_to_search)
        parts.append(
            f"Found {len(relevant_reviews)} review(s) mentioning **{kw_str}** "
            f"out of {total} total (last {window}):"
        )
        for r in relevant_reviews[:4]:
            parts.append(f'\n> *"{r.text[:150]}"* — ⭐{r.rating}/5')

    else:
        parts.append(f"Here's a summary of **{dish_name}** ({total} reviews, last {window}):")
        parts.append(f"- Average rating: **{avg_rating:.1f}/5**")
        parts.append(f"- ⭐5: {five_star} | ⭐4: {four_star} | ⭐3: {three_star} | ⭐1-2: {len(low_reviews)}")
        if high_reviews:
            latest = high_reviews[0]
            parts.append(f'\n> Latest positive: *"{latest.text[:120]}"* — ⭐{latest.rating}/5')

    answer = "\n".join(parts)

    return ChatResponse(
        answer=answer,
        reviewIdsUsed=used_ids[:10],
        window=window,
        metadata={
            "reviewsAnalyzed": total,
            "avgRating": round(avg_rating, 1),
            "keywordsMatched": keywords_to_search,
        },
    )


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest) -> ChatResponse:
    return analyze_reviews(request.question, request.reviews, request.dishName, request.window)
