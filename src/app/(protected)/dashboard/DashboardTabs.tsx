'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { type PaymentRequest, type PaymentRequestStatus } from '@/types/database';
import RequestCard from './RequestCard';
import Link from 'next/link';

const STATUS_OPTIONS: Array<{ value: 'all' | PaymentRequestStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface DashboardTabsProps {
  sentRequests: PaymentRequest[];
  receivedRequests: PaymentRequest[];
}

export default function DashboardTabs({ sentRequests, receivedRequests }: DashboardTabsProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentRequestStatus>('all');
  const [search, setSearch] = useState('');

  function filterRequests(requests: PaymentRequest[]) {
    return requests
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.recipient_email?.toLowerCase().includes(q) ||
          r.recipient_phone?.includes(q) ||
          false
        );
      });
  }

  function clearFilters() {
    setStatusFilter('all');
    setSearch('');
  }

  function RequestList({ requests, emptyMessage }: { requests: PaymentRequest[]; emptyMessage: string }) {
    const filtered = filterRequests(requests);

    if (requests.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500" data-testid="empty-state">
          <p className="mb-4">{emptyMessage}</p>
          <Link href="/request/new">
            <Button data-testid="empty-cta">Send your first request!</Button>
          </Link>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500" data-testid="no-results-state">
          <p className="mb-2">No requests match your filters.</p>
          <button
            onClick={clearFilters}
            className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            data-testid="clear-filters-btn"
          >
            Clear filters
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3" data-testid="request-list">
        {filtered.map((r) => (
          <RequestCard key={r.id} request={r} />
        ))}
      </div>
    );
  }

  return (
    <div data-testid="dashboard-tabs">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search by email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
          data-testid="search-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          data-testid="status-filter"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="sent">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="sent" data-testid="sent-tab">
            Sent
          </TabsTrigger>
          <TabsTrigger value="received" data-testid="received-tab">
            Received
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-4">
          <RequestList
            requests={sentRequests}
            emptyMessage="No requests yet. Send your first request!"
          />
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          <RequestList
            requests={receivedRequests}
            emptyMessage="No requests yet. Send your first request!"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
