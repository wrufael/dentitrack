import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';
import api from '../../api';

const METHODS = [
  {
    value: 'Cash',
    label: 'Cash',
    icon: BanknotesIcon,
  },
  {
    value: 'Telebirr',
    label: 'Telebirr',
    icon: DevicePhoneMobileIcon,
  },
  {
    value: 'CBEBirr',
    label: 'CBE Birr',
    icon: DevicePhoneMobileIcon,
  },
  {
    value: 'BankTransfer',
    label: 'Bank Transfer',
    icon: BuildingLibraryIcon,
  },
  {
    value: 'Card',
    label: 'Card',
    icon: CreditCardIcon,
  },
];

const money = (value) =>
  `ETB ${Number(value || 0).toLocaleString()}`;

const labels = {
  pending: '⏳ Pending',
  partial: '🟡 Partial',
  paid: '✅ Paid',
  done: '✔ Done',
  cancelled: '🚫 Cancelled',
};

const badges = {
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-cyan-100 text-cyan-700',
  paid: 'bg-green-100 text-green-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const normalize = (request) => ({
  ...request,

  patient_name:
    request.patient_name ||
    request.patient?.full_name ||
    request.patient?.name ||
    request.patient ||
    'Unknown patient',

  patient_code:
    request.patient_code ||
    request.patient?.patient_id ||
    request.patientId ||
    request.patient_id ||
    '—',

  total: Number(
    request.total ??
      request.amount ??
      0
  ),

  paid: Number(
    request.paid ??
      request.amount_paid ??
      0
  ),

  balance: Number(
    request.balance ??
      (
        (request.total ??
          request.amount ??
          0) -
        (request.paid ??
          request.amount_paid ??
          0)
      )
  ),

  items: Array.isArray(
    request.items
  )
    ? request.items
    : [],
});

export default function CashierPayments() {

  const [requests, setRequests] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState('pending');

  const [detail, setDetail] =
    useState(null);

  const [collect, setCollect] =
    useState(null);

  const [amount, setAmount] =
    useState('');

  const [method, setMethod] =
    useState('Cash');

  const [proof, setProof] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

  const [cancelling, setCancelling] =
    useState(false);

  const load = useCallback(
    async () => {

      try {

        setLoading(true);

        const response =
          await api.get('/payments');

        setRequests(
          (response.data?.data || [])
            .map(normalize)
        );

      } catch (error) {

        toast.error(
          error.response?.data?.message ||
            'Unable to load payment requests.'
        );

      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {

    load();

    const timer = setInterval(
      load,
      10000
    );

    return () =>
      clearInterval(timer);

  }, [load]);

  const counts = useMemo(
    () => ({
      all: requests.length,

      pending:
        requests.filter(
          (r) =>
            r.status === 'pending'
        ).length,

      partial:
        requests.filter(
          (r) =>
            r.status === 'partial'
        ).length,

      paid:
        requests.filter(
          (r) =>
            ['paid', 'done'].includes(
              r.status
            )
        ).length,
    }),
    [requests]
  );

  const visible = useMemo(
    () =>
      requests.filter((request) => {

        const query =
          search
            .toLowerCase()
            .trim();

        const statusMatches =
          filter === 'all'
            ? true
            : filter === 'paid'
            ? ['paid', 'done'].includes(
                request.status
              )
            : request.status === filter;

        const text =
          `${request.patient_name} ` +
          `${request.patient_code} ` +
          `${request.request_code || ''}`
            .toLowerCase();

        return (
          statusMatches &&
          (!query ||
            text.includes(query))
        );
      }),
    [
      requests,
      filter,
      search,
    ]
  );

  const openDetails = async (
    request
  ) => {

    try {

      const response =
        await api.get(
          `/payments/${request.id}`
        );

      setDetail(
        normalize(
          response.data?.data ||
            request
        )
      );

    } catch {
      setDetail(request);
    }
  };

  const openCollect = (
    request
  ) => {

    setDetail(null);

    setCollect(request);

    setAmount(
      String(request.balance)
    );

    setMethod('Cash');

    setProof(null);
  };

  const submitCollection =
    async (event) => {

      event.preventDefault();

      if (!collect) return;

      const received =
        Number(amount);

      if (
        !received ||
        received <= 0
      ) {
        toast.error(
          'Enter a valid amount.'
        );
        return;
      }

      if (
        received >
        collect.balance
      ) {
        toast.error(
          'Amount cannot be greater than the outstanding balance.'
        );
        return;
      }

      if (
        method !== 'Cash' &&
        !proof
      ) {
        toast.error(
          'Upload payment proof for non-cash payments.'
        );
        return;
      }

      try {

        setSaving(true);

        const formData =
          new FormData();

        formData.append(
          'amount',
          received
        );

        formData.append(
          'payment_method',
          method
        );

        if (proof) {
          formData.append(
            'proof_photo',
            proof
          );
        }

        const response =
          await api.post(
            `/payments/${collect.id}/collect`,
            formData,
            {
              headers: {
                'Content-Type':
                  'multipart/form-data',
              },
            }
          );

        const updated =
          normalize(
            response.data?.data || {}
          );

        setRequests(
          (previous) =>
            previous.map(
              (request) =>
                request.id ===
                collect.id
                  ? {
                      ...request,
                      ...updated,
                    }
                  : request
            )
        );

        toast.success(
          `${money(received)} collected successfully.`
        );

        setCollect(null);
        setAmount('');
        setProof(null);

        await load();

      } catch (error) {

        const errors =
          error.response?.data
            ?.errors;

        const firstError =
          errors
            ? Object.values(
                errors
              ).flat()[0]
            : null;

        toast.error(
          firstError ||
            error.response?.data
              ?.message ||
            'Unable to collect payment.'
        );

      } finally {
        setSaving(false);
      }
    };

  const cancelRequest =
    async (request) => {

      if (
        !window.confirm(
          `Cancel payment request for ${request.patient_name}?`
        )
      ) {
        return;
      }

      try {

        setCancelling(true);

        const response =
          await api.post(
            `/payments/${request.id}/cancel`
          );

        const updated =
          normalize(
            response.data?.data || {
              ...request,
              status: 'cancelled',
            }
          );

        setRequests(
          (previous) =>
            previous.map(
              (item) =>
                item.id === request.id
                  ? updated
                  : item
            )
        );

        setDetail(null);

        toast.success(
          'Payment request cancelled.'
        );

      } catch (error) {

        toast.error(
          error.response?.data?.message ||
            'Unable to cancel request.'
        );

      } finally {
        setCancelling(false);
      }
    };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row justify-between gap-4">

        <div>

          <h1 className="text-2xl font-bold">
            💰 Payment Collection
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Review requests from doctors and business owners, collect money, and keep the transaction record.
          </p>

        </div>

        <button
          onClick={load}
          className="border rounded-xl px-4 py-2.5 inline-flex gap-2 items-center self-start"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Refresh
        </button>

      </div>

      <div className="grid md:grid-cols-4 gap-4">

        <Stat
          title="All Requests"
          value={counts.all}
        />

        <Stat
          title="Waiting"
          value={
            counts.pending +
            counts.partial
          }
          accent="yellow"
        />

        <Stat
          title="Pending Amount"
          value={money(
            requests
              .filter((r) =>
                [
                  'pending',
                  'partial',
                ].includes(r.status)
              )
              .reduce(
                (sum, r) =>
                  sum + r.balance,
                0
              )
          )}
          accent="red"
        />

        <Stat
          title="Paid Requests"
          value={counts.paid}
          accent="green"
        />

      </div>

      <div className="bg-white border rounded-2xl p-4 space-y-3">

        <div className="relative">

          <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search patient, patient ID or request code..."
            className="w-full pl-10 py-2.5 border rounded-xl"
          />

        </div>

        <div className="flex flex-wrap gap-2">

          {[
            'all',
            'pending',
            'partial',
            'paid',
          ].map((status) => (

            <button
              key={status}
              onClick={() =>
                setFilter(status)
              }
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === status
                  ? 'bg-[#0EA5A5] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status === 'all'
                ? '📋 All'
                : labels[status]}

              {' '}

              (
              {status === 'all'
                ? counts.all
                : status === 'pending'
                ? counts.pending
                : status === 'partial'
                ? counts.partial
                : counts.paid}
              )
            </button>

          ))}

        </div>

      </div>

      <div className="bg-white border rounded-2xl p-5">

        <h2 className="font-semibold mb-4">
          Requests to Collect
        </h2>

        {loading ? (

          <div className="py-12 text-center text-gray-500">
            Loading...
          </div>

        ) : visible.length === 0 ? (

          <div className="py-12 text-center text-gray-500">
            No payment requests in this view.
          </div>

        ) : (

          <div className="space-y-3">

            {visible.map((request) => (

              <div
                key={request.id}
                className="rounded-xl bg-[#F2F8FB] p-4"
              >

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                  <div className="flex gap-3 items-center">

                    <div className="w-12 h-12 rounded-full bg-[#0EA5A5] text-white flex items-center justify-center font-bold">
                      {request.patient_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>

                      <div className="font-semibold">
                        {request.patient_name}
                      </div>

                      <div className="text-sm text-gray-500">
                        {request.patient_code}
                        {' · '}
                        {request.request_code ||
                          `Request #${request.id}`}
                      </div>

                      <div className="text-xs text-gray-400">
                        Requested by{' '}
                        {request.requested_by_user?.name ||
                          request.doctor_name ||
                          request.created_by?.name ||
                          'Clinic staff'}
                      </div>

                    </div>

                  </div>

                  <div className="flex flex-wrap items-center gap-3">

                    <div className="text-right">

                      <div className="font-bold">
                        {money(
                          request.total
                        )}
                      </div>

                      <div className="text-xs text-gray-500">
                        Balance{' '}
                        {money(
                          request.balance
                        )}
                      </div>

                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        badges[
                          request.status
                        ] ||
                        badges.cancelled
                      }`}
                    >
                      {labels[
                        request.status
                      ] ||
                        request.status}
                    </span>

                    <button
                      onClick={() =>
                        openDetails(
                          request
                        )
                      }
                      className="p-2 text-[#0EA5A5]"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>

                    {[
                      'pending',
                      'partial',
                    ].includes(
                      request.status
                    ) && (
                      <button
                        onClick={() =>
                          openCollect(
                            request
                          )
                        }
                        className="px-4 py-2 bg-[#0EA5A5] text-white rounded-xl font-semibold"
                      >
                        Collect{' '}
                        {money(
                          request.balance
                        )}
                      </button>
                    )}

                  </div>

                </div>

                <div className="mt-3 pt-3 border-t flex flex-wrap gap-2">

                  {request.items.map(
                    (item, index) => (
                      <span
                        key={index}
                        className="bg-white px-3 py-1 rounded-full text-xs"
                      >
                        {item.name}
                        {' · '}
                        {money(item.price)}
                      </span>
                    )
                  )}

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {detail && (

        <Modal>

          <Header
            title="Verify Payment Request"
            close={() =>
              setDetail(null)
            }
          />

          <div className="p-5 space-y-4">

            <div className="grid md:grid-cols-4 gap-3">

              <Info
                label="Patient"
                value={detail.patient_name}
              />

              <Info
                label="Patient ID"
                value={detail.patient_code}
              />

              <Info
                label="Requested By"
                value={
                  detail.requested_by_user?.name ||
                  detail.doctor_name ||
                  detail.created_by?.name
                }
              />

              <Info
                label="Status"
                value={
                  labels[
                    detail.status
                  ] ||
                  detail.status
                }
              />

            </div>

            <div className="bg-gray-50 rounded-xl p-4">

              <h3 className="font-semibold mb-2">
                Services
              </h3>

              {detail.items.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <span>
                      {item.name}
                    </span>

                    <b>
                      {money(item.price)}
                    </b>
                  </div>
                )
              )}

            </div>

            <div className="grid grid-cols-3 gap-3">

              <Info
                label="Total"
                value={money(detail.total)}
              />

              <Info
                label="Paid"
                value={money(detail.paid)}
              />

              <Info
                label="Balance"
                value={money(detail.balance)}
              />

            </div>

            {detail.notes && (
              <div className="p-3 rounded-xl bg-blue-50 text-sm">
                {detail.notes}
              </div>
            )}

            <div className="flex justify-end gap-2">

              {[
                'pending',
                'partial',
              ].includes(
                detail.status
              ) && (
                <>
                  <button
                    disabled={cancelling}
                    onClick={() =>
                      cancelRequest(
                        detail
                      )
                    }
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl inline-flex gap-2"
                  >
                    <NoSymbolIcon className="w-5 h-5" />
                    Cancel
                  </button>

                  <button
                    onClick={() =>
                      openCollect(
                        detail
                      )
                    }
                    className="px-5 py-2 bg-[#0EA5A5] text-white rounded-xl font-semibold"
                  >
                    Collect{' '}
                    {money(
                      detail.balance
                    )}
                  </button>
                </>
              )}

              <button
                onClick={() =>
                  setDetail(null)
                }
                className="px-4 py-2 bg-gray-100 rounded-xl"
              >
                Close
              </button>

            </div>

          </div>

        </Modal>
      )}

      {collect && (

        <Modal>

          <Header
            title="Collect Payment"
            close={() =>
              !saving &&
              setCollect(null)
            }
          />

          <form
            onSubmit={
              submitCollection
            }
          >

            <div className="p-5 space-y-5">

              <div className="bg-[#F2F8FB] rounded-xl p-4">

                <div className="font-semibold">
                  {collect.patient_name}
                </div>

                <div className="text-sm text-gray-500">
                  {collect.patient_code}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">

                  <Info
                    label="Total"
                    value={money(
                      collect.total
                    )}
                  />

                  <Info
                    label="Outstanding"
                    value={money(
                      collect.balance
                    )}
                  />

                </div>

              </div>

              <label className="block text-sm font-semibold">

                Amount received

                <input
                  type="number"
                  min="1"
                  max={collect.balance}
                  step="0.01"
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target.value
                    )
                  }
                  className="mt-1 w-full border rounded-xl p-3 text-lg font-bold"
                />

              </label>

              <div>

                <div className="text-sm font-semibold mb-2">
                  Payment Method
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">

                  {METHODS.map(
                    (item) => {

                      const Icon =
                        item.icon;

                      return (
                        <button
                          type="button"
                          key={item.value}
                          onClick={() =>
                            setMethod(
                              item.value
                            )
                          }
                          className={`p-3 rounded-xl border text-left ${
                            method ===
                            item.value
                              ? 'border-[#0EA5A5] bg-[#0EA5A5]/5'
                              : ''
                          }`}
                        >

                          <Icon className="w-5 h-5 text-[#0EA5A5]" />

                          <div className="text-sm font-medium mt-1">
                            {item.label}
                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

              </div>

              {method !== 'Cash' && (

                <label className="block text-sm font-semibold">

                  Payment proof

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setProof(
                        event.target.files?.[0] ||
                          null
                      )
                    }
                    className="mt-1 w-full border rounded-xl p-2"
                  />

                  <span className="text-xs text-gray-500">
                    Upload receipt/reference proof.
                  </span>

                </label>

              )}

              <div className="p-3 rounded-xl bg-yellow-50 text-sm text-yellow-800">
                Verify the patient, requested amount and payment method before clicking Collect.
              </div>

            </div>

            <div className="p-5 border-t flex justify-end gap-2">

              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  setCollect(null)
                }
                className="px-5 py-2.5 bg-gray-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className="px-5 py-2.5 bg-[#0EA5A5] text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {saving
                  ? 'Collecting...'
                  : `Confirm Collection · ${money(
                      amount
                    )}`}
              </button>

            </div>

          </form>

        </Modal>
      )}

    </div>
  );
}

function Stat({
  title,
  value,
  accent,
}) {
  return (
    <div className="bg-white border rounded-2xl p-5">

      <div className="text-sm text-gray-500">
        {title}
      </div>

      <div
        className={`text-2xl font-bold mt-1 ${
          accent === 'yellow'
            ? 'text-yellow-600'
            : accent === 'red'
            ? 'text-red-600'
            : accent === 'green'
            ? 'text-green-600'
            : ''
        }`}
      >
        {value}
      </div>

    </div>
  );
}

function Modal({
  children,
}) {
  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">

        {children}

      </div>

    </div>
  );
}

function Header({
  title,
  close,
}) {
  return (
    <div className="p-5 border-b flex justify-between">

      <h2 className="text-xl font-bold">
        {title}
      </h2>

      <button
        type="button"
        onClick={close}
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

    </div>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div>

      <div className="text-xs text-gray-500">
        {label}
      </div>

      <div className="font-medium mt-0.5">
        {value ?? '—'}
      </div>

    </div>
  );
}