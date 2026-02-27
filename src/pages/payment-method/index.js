"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Navbar from "@/components/layout/navbar";
import Button from "@/components/ui/buttons/buttons";
import { useAuth } from "@/contexts/authentication";
import axios from "axios";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function SetupCardForm({ onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError("");

    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });

    setLoading(false);

    if (stripeError) {
      setError(stripeError.message || "Unable to update payment method");
      return;
    }

    if (setupIntent?.status === "succeeded") {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <p className="text-red-500 text-sm font-sans">{error}</p>
      )}
      <div className="flex justify-end mt-4">
        <Button
          type="submit"
          buttonStyle="primary"
          buttonText={loading ? "Processing..." : "Update Payment Method"}
          disabled={loading || !stripe}
          className="h-[48px] px-8 mt-6"
        />
      </div>
    </form>
  );
}

export default function PaymentMethodPage() {
  const { user, getUserLoading } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedCards, setSavedCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(false);

  useEffect(() => {
    if (!user?.stripe_customer_id) return;

    const fetchSavedCards = async () => {
      try {
        setLoadingCards(true);
        const res = await axios.get("/api/stripe/payment-methods", {
          params: { stripeCustomerId: user.stripe_customer_id },
        });
        setSavedCards(res.data);
      } catch (err) {
        console.error("Fetch saved cards error:", err);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchSavedCards();
  }, [user]);

  useEffect(() => {
    const loadSetupIntent = async () => {
      if (!user?.stripe_customer_id) return;

      try {
        setLoading(true);
        setError("");

        // #region agent log
        fetch('http://127.0.0.1:7447/ingest/a40799b2-6c37-45b3-85a5-91c821958353',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27948e'},body:JSON.stringify({sessionId:'27948e',runId:'pre-fix',hypothesisId:'A',location:'src/pages/payment-method/index.js:77',message:'Calling create-setup-intent',data:{hasUser:true},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        const res = await axios.post("/api/stripe/create-setup-intent", {
          stripeCustomerId: user.stripe_customer_id,
        });

        // #region agent log
        fetch('http://127.0.0.1:7447/ingest/a40799b2-6c37-45b3-85a5-91c821958353',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27948e'},body:JSON.stringify({sessionId:'27948e',runId:'pre-fix',hypothesisId:'B',location:'src/pages/payment-method/index.js:81',message:'Received create-setup-intent response',data:{status:res.status},timestamp:Date.now()})}).catch(()=>{});
        // #endregion

        setClientSecret(res.data.clientSecret);
      } catch (err) {
        console.error("Create setup intent error:", err);
        // #region agent log
        fetch('http://127.0.0.1:7447/ingest/a40799b2-6c37-45b3-85a5-91c821958353',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'27948e'},body:JSON.stringify({sessionId:'27948e',runId:'pre-fix',hypothesisId:'C',location:'src/pages/payment-method/index.js:83',message:'Error in loadSetupIntent',data:{name:err?.name,message:err?.message},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        setError("Cannot load payment form right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadSetupIntent();
  }, [user]);

  const handleSuccess = () => {
    setSuccessMessage("Your payment method has been updated.");
  };

  const handleDeleteCard = async (id) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      await axios.delete("/api/stripe/detach-payment-method", {
        data: { paymentMethodId: id },
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : undefined,
      });

      setSavedCards((prev) => prev.filter((card) => card.id !== id));
    } catch (err) {
      console.error("Failed to delete card", err);
    }
  };

  return (
    <div className="bg-[#F7F7FB] flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[1440px] lg:px-[165px] pb-10">
          <section className="bg-transparent">
            <div className="flex items-center justify-between mb-5 mx-4 lg:mx-0">
              <h1 className="headline-3-booking-title text-[44px] text-[#1F3B33] lg:text-[68px]">
                Payment Method
              </h1>
            </div>

            <div className="mx-4 lg:mx-0 bg-[#F1F2F6] rounded-lg px-6 py-8 lg:px-10 lg:py-12 shadow-sm">
              <h2 className="font-sans text-lg font-semibold text-[#7C8194] mb-6 lg:text-">
                Credit Card
              </h2>

              {user && (
                <div className="space-y-3 mb-8">
                  {loadingCards && (
                    <p className="font-sans text-base text-gray-600">
                      Loading saved cards...
                    </p>
                  )}

                  {!loadingCards && savedCards.length === 0 && (
                    <p className="font-sans text-base text-gray-600">
                      You have no saved cards yet.
                    </p>
                  )}

                  {!loadingCards &&
                    savedCards.map((card) => (
                      <div
                        key={card.id}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg border-2 border-[#E4E6ED] bg-white hover:border-gray-400 hover:bg-gray-50/50 transition-all font-sans text-base text-[#2A2E3F]"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">
                            •••• {card.card.last4}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            {card.card.brand}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className="text-red-500 text-sm font-medium hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {getUserLoading && (
                <p className="font-sans text-base text-gray-600">
                  Loading user information...
                </p>
              )}

              {!getUserLoading && !user && (
                <p className="font-sans text-base text-gray-600">
                  Please log in to manage your payment methods.
                </p>
              )}

              {user && error && (
                <p className="font-sans text-base text-red-500 mb-4">
                  {error}
                </p>
              )}

              {user && successMessage && (
                <p className="font-sans text-base text-green-600 mb-4">
                  {successMessage}
                </p>
              )}

              {user && !error && clientSecret && (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, locale: "en" }}
                >
                  <SetupCardForm onSuccess={handleSuccess} />
                </Elements>
              )}

              {user && !error && !clientSecret && !loading && (
                <p className="font-sans text-base text-gray-600">
                  Preparing secure payment form...
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}