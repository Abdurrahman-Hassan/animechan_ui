import { useEffect, useState } from "react";

export default function Home() {
  const [quoteData, setQuoteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quoteHistory, setQuoteHistory] = useState([]);
  const [anonymousUserId, setAnonymousUserId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    setHistoryLoading(true);
    const storedUserId = localStorage.getItem("anonymousUserId");
    if (storedUserId) {
      setAnonymousUserId(storedUserId);
      fetchQuoteHistoryFromBackend(storedUserId);
      fetchQuotes(storedUserId);
    } else {
      fetchQuotes(null);
      setHistoryLoading(false);
    }
  }, []);

  async function fetchQuotes(userIdFromStorage) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://animechan.io/api/v1/quotes/random", {
        headers: {
          Accept: "application/json",
        },
      }).catch((error) => {
        throw new Error("Network request failed");
      });

      if (response.status === 429) {
        setError("Rate limit exceeded. Please wait a moment before trying again.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const quote = await response.json();
      setQuoteData(quote?.data);
      saveQuoteToBackend(quote?.data, userIdFromStorage);
    } catch (err) {
      console.error("Error fetching quote:", err);
      setError(err.message || "Failed to load quote. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function saveQuoteToBackend(quoteData, userIdForSave) {
    try {
      const response = await fetch("/api/save-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quoteData: quoteData, anonymousUserId: userIdForSave }),
      });
      if (!response.ok) {
        console.error("Failed to save quote to backend:", response.statusText);
      } else {
        const data = await response.json();
        console.log("Quote saved to backend:", data);
        const receivedUserId = data.anonymousUserId;
        if (receivedUserId) {
          localStorage.setItem("anonymousUserId", receivedUserId);
          setAnonymousUserId(receivedUserId);
        }
      }
    } catch (error) {
      console.error("Error saving quote to backend:", error);
    }
  }

  async function fetchQuoteHistoryFromBackend(userId) {
    if (!userId) {
      setHistoryLoading(false);
      return;
    }
    try {
      const response = await fetch(`/api/get-user-quotes?userId=${userId}`);
      if (!response.ok) {
        console.error("Failed to fetch quote history:", response.statusText);
      } else {
        const data = await response.json();
        console.log("Quote history fetched from backend:", data.quotes);
        setQuoteHistory(data.quotes);
      }
    } catch (error) {
      console.error("Error fetching quote history:", error);
    } finally {
      setHistoryLoading(false);
    }
  }


  return (
    <div className="min-h-screen bg-gray-900 text-white flex justify-center items-center p-4 dark:bg-gray-800 dark:text-gray-50">
      <div className="container mx-auto max-w-7xl bg-gray-800 rounded-lg shadow-xl p-6 dark:bg-gray-900 relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 transition-all duration-300">
            <svg
              className="w-6 h-6 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
              />
            </svg>
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto hover:bg-red-700 p-1 rounded-full transition-colors duration-200"
              aria-label="Close error message"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
            <p className="mt-4 text-lg">Loading quote...</p>
          </div>
        ) : quoteData ? (
          <div className="mb-8">
            <div className="mb-4">
              <p className="text-xl italic font-semibold text-gray-200 mb-2 dark:text-gray-100">
                " {quoteData?.content} "
              </p>
              <div className="text-right text-gray-400 dark:text-gray-300">
                - {quoteData?.character.name}
              </div>
            </div>
            <div className="border-t border-gray-700 dark:border-gray-700 pt-4">
              <h3 className="text-md font-medium text-gray-300 dark:text-gray-200">
                Anime:
              </h3>
              <p className="text-lg font-semibold text-blue-300 hover:text-blue-200 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
                {quoteData?.anime?.name}
              </p>
            </div>
          </div>
        ) : null}

        {quoteHistory.length > 0 && (
          <div className="mt-8 border-t border-gray-700 dark:border-gray-700 pt-4">
            <h2 className="text-lg font-semibold text-gray-300 dark:text-gray-200 mb-4">
              Previous Quotes {historyLoading && "(Loading...)"}
            </h2>
            <div className="max-h-96 px-7 py-3 overflow-y-auto custom-scrollbar">
              {historyLoading ? (
                <div className="text-center">
                  <p>Loading quote history...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {quoteHistory.map((historyQuote, index) => (
                    <div
                      key={index}
                      className="rounded-lg shadow-md bg-gray-700 dark:bg-gray-800 hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="p-5">
                        <p className="text-md italic text-gray-100 mb-3 dark:text-gray-50 leading-relaxed">
                          " {historyQuote.quote?.content?.slice(0, 200) +
                            (historyQuote.quote?.content.length > 200 ? "..." : "")} "
                        </p>
                        <div className="text-right">
                          <span className="text-sm text-gray-300 dark:text-gray-400 font-medium">
                            - {historyQuote.quote?.character?.name}
                          </span>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            ({historyQuote.quote?.anime?.name})
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}