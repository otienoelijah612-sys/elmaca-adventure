"use client";

import { useEffect, useState } from "react";

interface Booking {
  bookingId: string;
  adventureTitle: string;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  status:
    | "pending"
    | "partially_paid"
    | "fully_paid"
    | "cancelled";
  phoneNumber: string | null;
  latestReceipt: string | null;
  paymentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  checkoutRequestId: string | null;
  merchantRequestId: string | null;
  adventureTitle: string;
  phoneNumber: string | null;
  amount: number;
  receiptNumber: string | null;
  transactionDate:
    | string
    | number
    | null;
  status:
    | "pending"
    | "success"
    | "failed";
  resultCode: number | null;
  resultDesc: string | null;
  receivedAt: string | null;
  createdAt: string;
  bookingId: string | null;
}

interface DashboardData {
  summary: {
    totalBookings: number;
    totalPaid: number;
    totalOutstanding: number;
    fullyPaid: number;
    partiallyPaid: number;
    pending: number;
  };
  bookings: Booking[];
}

interface BookingDetailsData {
  booking: {
    bookingId: string;
    adventureTitle: string;
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    status:
      | "pending"
      | "partially_paid"
      | "fully_paid"
      | "cancelled";
    createdAt: string;
    updatedAt: string;
  };
  payments: Payment[];
}

type BookingFilter =
  | "all"
  | "pending"
  | "partially_paid"
  | "fully_paid"
  | "cancelled";

export default function AdminDashboard() {
  // ----------------------------------------
  // Authentication
  // ----------------------------------------

  const [password, setPassword] =
    useState("");

  const [loggedIn, setLoggedIn] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  // ----------------------------------------
  // Dashboard
  // ----------------------------------------

  const [
    dashboardLoading,
    setDashboardLoading,
  ] = useState(false);

  const [data, setData] =
    useState<DashboardData | null>(
      null,
    );

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  const [
    bookingFilter,
    setBookingFilter,
  ] = useState<BookingFilter>(
    "all",
  );

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  // ----------------------------------------
  // Booking details
  // ----------------------------------------

  const [
    selectedBooking,
    setSelectedBooking,
  ] =
    useState<BookingDetailsData | null>(
      null,
    );

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  // ----------------------------------------
  // Errors
  // ----------------------------------------

  const [error, setError] =
    useState("");

  // ----------------------------------------
  // Helpers
  // ----------------------------------------

  const money = (
    amount: number,
  ) =>
    `KSh ${amount.toLocaleString()}`;

  const formatDate = (
    value: string | null,
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return "—";
    }

    return date.toLocaleString(
      "en-KE",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );
  };

  const formatTransactionDate = (
    value:
      | string
      | number
      | null,
  ) => {
    if (value === null) {
      return "—";
    }

    const raw =
      String(value);

    if (
      /^\d{14}$/.test(raw)
    ) {
      const year =
        Number(
          raw.slice(0, 4),
        );

      const month =
        Number(
          raw.slice(4, 6),
        ) - 1;

      const day =
        Number(
          raw.slice(6, 8),
        );

      const hour =
        Number(
          raw.slice(8, 10),
        );

      const minute =
        Number(
          raw.slice(10, 12),
        );

      const second =
        Number(
          raw.slice(12, 14),
        );

      const date =
        new Date(
          year,
          month,
          day,
          hour,
          minute,
          second,
        );

      return date.toLocaleString(
        "en-KE",
        {
          dateStyle:
            "medium",
          timeStyle:
            "short",
        },
      );
    }

    return formatDate(
      raw,
    );
  };

  // ----------------------------------------
  // Load dashboard
  // ----------------------------------------

  const loadDashboard =
    async () => {
      setDashboardLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            "/api/admin/bookings",
            {
              cache:
                "no-store",
            },
          );

        if (
          response.status ===
          401
        ) {
          setLoggedIn(false);
          setData(null);
          return;
        }

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to load dashboard.",
          );
        }

        setData(result);
        setLoggedIn(true);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(
          "Dashboard load error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard.",
        );
      } finally {
        setDashboardLoading(
          false,
        );
      }
    };

  // ----------------------------------------
  // Load booking details
  // ----------------------------------------

  const loadBookingDetails =
    async (
      bookingId: string,
    ) => {
      setDetailsLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/admin/bookings?bookingId=${encodeURIComponent(
              bookingId,
            )}`,
            {
              cache:
                "no-store",
            },
          );

        if (
          response.status ===
          401
        ) {
          setLoggedIn(false);
          setSelectedBooking(
            null,
          );
          return;
        }

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to load booking details.",
          );
        }

        setSelectedBooking(
          result,
        );
      } catch (err) {
        console.error(
          "Booking details error:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load booking details.",
        );
      } finally {
        setDetailsLoading(
          false,
        );
      }
    };

  // ----------------------------------------
  // Authentication check
  // ----------------------------------------

  useEffect(() => {
    const checkAuth =
      async () => {
        try {
          const response =
            await fetch(
              "/api/admin/bookings",
              {
                cache:
                  "no-store",
              },
            );

          if (
            response.ok
          ) {
            const result =
              await response.json();

            setData(result);
            setLoggedIn(true);
            setLastUpdated(new Date());
          }
        } catch {
          // Not logged in.
        } finally {
          setCheckingAuth(
            false,
          );
        }
      };

    checkAuth();
  }, []);

  // ----------------------------------------
  // Login
  // ----------------------------------------

  const handleLogin =
    async (
      event: React.FormEvent,
    ) => {
      event.preventDefault();

      if (!password.trim()) {
        setError(
          "Enter your admin password.",
        );

        return;
      }

      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            "/api/admin/login",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  password,
                }),
            },
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Login failed.",
          );
        }

        setPassword("");
        setLoggedIn(true);

        await loadDashboard();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Login failed.",
        );
      } finally {
        setLoading(false);
      }
    };

  // ----------------------------------------
  // Logout
  // ----------------------------------------

  const handleLogout =
    async () => {
      try {
        await fetch(
          "/api/admin/logout",
          {
            method:
              "POST",
          },
        );
      } finally {
        setLoggedIn(false);
        setData(null);
        setSelectedBooking(
          null,
        );
      }
    };

  // ----------------------------------------
  // Export bookings to CSV
  // ----------------------------------------

  const handleExportCSV = () => {
    const bookings =
      data?.bookings ?? [];

    if (bookings.length === 0) {
      setError("There are no bookings to export.");
      return;
    }

    const headers = [
      "Booking ID",
      "Adventure",
      "M-Pesa Number",
      "Total",
      "Paid",
      "Balance",
      "Status",
      "Payment Count",
      "Latest Receipt",
      "Created",
    ];

    const escapeCSV = (
      value: string | number | null,
    ) => {
      const stringValue =
        value === null || value === undefined
          ? ""
          : String(value);

      return `"${stringValue.replace(/"/g, '""')}"`;
    };

    const rows = bookings.map(
      (booking) => [
        booking.bookingId,
        booking.adventureTitle,
        booking.phoneNumber ?? "",
        booking.totalAmount,
        booking.totalPaid,
        booking.remainingBalance,
        booking.status,
        booking.paymentCount,
        booking.latestReceipt ?? "",
        formatDate(booking.createdAt),
      ],
    );

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(","),
      ),
    ].join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    const date =
      new Date()
        .toISOString()
        .slice(0, 10);

    link.href = url;
    link.download =
      `elmaca-bookings-${date}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    URL.revokeObjectURL(url);
  };

  // ----------------------------------------
  // Authentication loading
  // ----------------------------------------

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-sm text-slate-500">
          Loading...
        </div>
      </main>
    );
  }

  // ----------------------------------------
  // Login
  // ----------------------------------------

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              Elmaca Adventure
            </p>

            <h1 className="mt-2 text-2xl font-bold text-navy">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage
              bookings and
              payments.
            </p>
          </div>

          <form
            onSubmit={
              handleLogin
            }
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="adminPassword"
                className="mb-2 block text-sm font-medium text-navy"
              >
                Password
              </label>

              <input
                id="adminPassword"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(
                  event,
                ) =>
                  setPassword(
                    event.target
                      .value,
                  )
                }
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-orange focus:ring-2 focus:ring-orange/20"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const summary =
    data?.summary;

  // ----------------------------------------
  // Combined search + status filter
  // ----------------------------------------

  const normalizedSearch =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredBookings =
    (data?.bookings ?? []).filter(
      (booking) => {
        const matchesStatus =
          bookingFilter ===
            "all" ||
          booking.status ===
            bookingFilter;

        const matchesSearch =
          !normalizedSearch ||
          booking.bookingId
            .toLowerCase()
            .includes(
              normalizedSearch,
            ) ||
          (
            booking.phoneNumber ??
            ""
          )
            .toLowerCase()
            .includes(
              normalizedSearch,
            );

        return (
          matchesStatus &&
          matchesSearch
        );
      },
    );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-navy">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">
              Elmaca Adventure
            </p>

            <h1 className="mt-1 text-2xl font-bold text-white">
              Booking Dashboard
            </h1>

            <p className="mt-1 text-xs text-slate-300">
              Last updated:{" "}
              {lastUpdated
                ? lastUpdated.toLocaleString(
                    "en-KE",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                    },
                  )
                : "Not updated yet"}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={
                loadDashboard
              }
              disabled={
                dashboardLoading
              }
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
            >
              {dashboardLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

            <button
              type="button"
              onClick={
                handleExportCSV
              }
              disabled={
                !data?.bookings?.length
              }
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={
                handleLogout
              }
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-navy hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Bookings"
            value={
              summary?.totalBookings ??
              0
            }
          />

          <SummaryCard
            label="Total Paid"
            value={money(
              summary?.totalPaid ??
                0,
            )}
          />

          <SummaryCard
            label="Outstanding"
            value={money(
              summary?.totalOutstanding ??
                0,
            )}
          />

          <SummaryCard
            label="Fully Paid"
            value={
              summary?.fullyPaid ??
              0
            }
          />
        </div>

        {/* Status */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MiniStatus
            label="Pending"
            value={
              summary?.pending ??
              0
            }
          />

          <MiniStatus
            label="Partially Paid"
            value={
              summary?.partiallyPaid ??
              0
            }
          />

          <MiniStatus
            label="Fully Paid"
            value={
              summary?.fullyPaid ??
              0
            }
          />
        </div>

        {/* Bookings */}
        <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-bold text-navy">
              Bookings
            </h2>

            {/* Search */}
            <div className="mt-4">
              <label
                htmlFor="bookingSearch"
                className="sr-only"
              >
                Search bookings
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  🔎
                </span>

                <input
                  id="bookingSearch"
                  type="search"
                  value={searchQuery}
                  onChange={(
                    event,
                  ) =>
                    setSearchQuery(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search by Booking ID or M-Pesa number..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-navy outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/20"
                />
              </div>
            </div>

            {/* Search + filter information */}
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-slate-500">
                Click a Booking ID
                to view its payment
                history.
              </p>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <FilterButton
                  label="All"
                  active={
                    bookingFilter ===
                    "all"
                  }
                  onClick={() =>
                    setBookingFilter(
                      "all",
                    )
                  }
                />

                <FilterButton
                  label="Pending"
                  active={
                    bookingFilter ===
                    "pending"
                  }
                  onClick={() =>
                    setBookingFilter(
                      "pending",
                    )
                  }
                />

                <FilterButton
                  label="Partially Paid"
                  active={
                    bookingFilter ===
                    "partially_paid"
                  }
                  onClick={() =>
                    setBookingFilter(
                      "partially_paid",
                    )
                  }
                />

                <FilterButton
                  label="Fully Paid"
                  active={
                    bookingFilter ===
                    "fully_paid"
                  }
                  onClick={() =>
                    setBookingFilter(
                      "fully_paid",
                    )
                  }
                />

                <FilterButton
                  label="Cancelled"
                  active={
                    bookingFilter ===
                    "cancelled"
                  }
                  onClick={() =>
                    setBookingFilter(
                      "cancelled",
                    )
                  }
                />
              </div>
            </div>

            {/* Results count */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-400">
                Showing{" "}
                {
                  filteredBookings.length
                }{" "}
                of{" "}
                {data?.bookings.length ??
                  0}{" "}
                bookings
              </p>

              {(searchQuery ||
                bookingFilter !==
                  "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(
                      "",
                    );
                    setBookingFilter(
                      "all",
                    );
                  }}
                  className="text-xs font-semibold text-orange hover:underline"
                >
                  Clear search & filter
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">
                    Booking
                  </th>

                  <th className="px-6 py-4">
                    M-Pesa Number
                  </th>

                  <th className="px-6 py-4">
                    Total
                  </th>

                  <th className="px-6 py-4">
                    Paid
                  </th>

                  <th className="px-6 py-4">
                    Balance
                  </th>

                  <th className="px-6 py-4">
                    Payments
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredBookings.length >
                0 ? (
                  filteredBookings.map(
                    (booking) => (
                      <tr
                        key={
                          booking.bookingId
                        }
                        className="border-b last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              loadBookingDetails(
                                booking.bookingId,
                              )
                            }
                            className="text-left"
                          >
                            <p className="font-semibold text-navy underline-offset-4 hover:underline">
                              {
                                booking.bookingId
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              {
                                booking.adventureTitle
                              }
                            </p>
                          </button>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {booking.phoneNumber ??
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-navy">
                          {money(
                            booking.totalAmount,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-green-700">
                          {money(
                            booking.totalPaid,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-orange">
                          {money(
                            booking.remainingBalance,
                          )}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-700">
                          {
                            booking.paymentCount
                          }
                        </td>

                        <td className="px-6 py-4">
                          <StatusBadge
                            status={
                              booking.status
                            }
                          />
                        </td>
                      </tr>
                    ),
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      {searchQuery ||
                      bookingFilter !==
                        "all"
                        ? "No bookings match your search or filter."
                        : "No bookings yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ===================================== */}
      {/* Booking Details Modal */}
      {/* ===================================== */}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedBooking(
              null,
            )
          }
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange">
                  Booking Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-navy">
                  {
                    selectedBooking
                      .booking
                      .bookingId
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedBooking(
                    null,
                  )
                }
                className="rounded-full px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                aria-label="Close booking details"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="px-6 py-16 text-center text-sm text-slate-500">
                Loading booking
                details...
              </div>
            ) : (
              <div className="space-y-6 p-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailCard
                    label="Adventure"
                    value={
                      selectedBooking
                        .booking
                        .adventureTitle
                    }
                  />

                  <DetailCard
                    label="Trip Total"
                    value={money(
                      selectedBooking
                        .booking
                        .totalAmount,
                    )}
                  />

                  <DetailCard
                    label="Total Paid"
                    value={money(
                      selectedBooking
                        .booking
                        .totalPaid,
                    )}
                  />

                  <DetailCard
                    label="Remaining Balance"
                    value={money(
                      selectedBooking
                        .booking
                        .remainingBalance,
                    )}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge
                    status={
                      selectedBooking
                        .booking
                        .status
                    }
                  />

                  <span className="text-sm text-slate-500">
                    Created{" "}
                    {formatDate(
                      selectedBooking
                        .booking
                        .createdAt,
                    )}
                  </span>
                </div>

                <section>
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-navy">
                      Payment History
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      All payment records
                      linked to this
                      booking.
                    </p>
                  </div>

                  {selectedBooking
                    .payments.length ===
                  0 ? (
                    <div className="rounded-xl border border-dashed px-5 py-10 text-center text-sm text-slate-500">
                      No payment records
                      for this booking
                      yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedBooking.payments.map(
                        (payment) => (
                          <div
                            key={
                              payment.id
                            }
                            className="rounded-xl border border-slate-200 p-4"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <PaymentStatusBadge
                                    status={
                                      payment.status
                                    }
                                  />

                                  <span className="text-sm text-slate-500">
                                    {formatDate(
                                      payment.createdAt,
                                    )}
                                  </span>
                                </div>

                                <p className="mt-3 text-xl font-bold text-navy">
                                  {money(
                                    payment.amount,
                                  )}
                                </p>
                              </div>

                              <div className="text-left sm:text-right">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  M-Pesa Receipt
                                </p>

                                <p className="mt-1 font-semibold text-navy">
                                  {
                                    payment.receiptNumber ??
                                    "Not available"
                                  }
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2">
                              <InfoRow
                                label="M-Pesa Number"
                                value={
                                  payment.phoneNumber ??
                                  "—"
                                }
                              />

                              <InfoRow
                                label="Transaction Date"
                                value={formatTransactionDate(
                                  payment.transactionDate,
                                )}
                              />

                              <InfoRow
                                label="Checkout Request"
                                value={
                                  payment.checkoutRequestId ??
                                  "—"
                                }
                              />

                              <InfoRow
                                label="Result"
                                value={
                                  payment.resultDesc ??
                                  "—"
                                }
                              />
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {detailsLoading &&
        !selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/40">
            <div className="rounded-xl bg-white px-6 py-4 text-sm font-medium text-navy shadow-xl">
              Loading...
            </div>
          </div>
        )}
    </main>
  );
}

// ----------------------------------------
// Filter Button
// ----------------------------------------

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "border-orange bg-orange text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-orange/40 hover:text-orange"
      }`}
    >
      {label}
    </button>
  );
}

// ----------------------------------------
// Summary Card
// ----------------------------------------

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-navy">
        {value}
      </p>
    </div>
  );
}

// ----------------------------------------
// Mini Status
// ----------------------------------------

function MiniStatus({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-white px-5 py-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {label}
        </span>

        <span className="font-bold text-navy">
          {value}
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------
// Booking Status
// ----------------------------------------

function StatusBadge({
  status,
}: {
  status:
    | "pending"
    | "partially_paid"
    | "fully_paid"
    | "cancelled";
}) {
  const styles = {
    pending:
      "bg-slate-100 text-slate-700",
    partially_paid:
      "bg-orange/10 text-orange",
    fully_paid:
      "bg-green-100 text-green-700",
    cancelled:
      "bg-red-100 text-red-700",
  };

  const label =
    status.replace(
      "_",
      " ",
    );

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {label}
    </span>
  );
}

// ----------------------------------------
// Payment Status
// ----------------------------------------

function PaymentStatusBadge({
  status,
}: {
  status:
    | "pending"
    | "success"
    | "failed";
}) {
  const styles = {
    pending:
      "bg-slate-100 text-slate-700",
    success:
      "bg-green-100 text-green-700",
    failed:
      "bg-red-100 text-red-700",
  };

  const labels = {
    pending: "Pending",
    success: "Successful",
    failed: "Failed",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

// ----------------------------------------
// Detail Card
// ----------------------------------------

function DetailCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words font-semibold text-navy">
        {value}
      </p>
    </div>
  );
}

// ----------------------------------------
// Info Row
// ----------------------------------------

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm text-slate-700">
        {value}
      </p>
    </div>
  );
}