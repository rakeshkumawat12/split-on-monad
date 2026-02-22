"use client";

import { useState, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther, decodeEventLog } from "viem";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ExpenseGroupABI, ExpenseGroupFactoryABI } from "./config/abis";
import useAddressBook from "./store/useAddressBook";

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;

// ─── Helpers ────────────────────────────────────────────────

function shortAddress(addr) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isAddr(a, b) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

function DisplayName({ address, currentUser }) {
  const getName = useAddressBook((s) => s.getName);
  const name = getName(address);
  const you = isAddr(address, currentUser);

  if (you)
    return (
      <span className="font-semibold" style={{ color: "var(--accent)" }}>
        You
      </span>
    );
  if (name)
    return (
      <span>
        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
          {name}
        </span>{" "}
        <span
          className="font-mono text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {shortAddress(address)}
        </span>
      </span>
    );
  return (
    <span className="font-mono" style={{ color: "var(--text-secondary)" }}>
      {shortAddress(address)}
    </span>
  );
}

// ─── Icons ──────────────────────────────────────────────────

function IconPlus({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconArrowRight({ size = 16 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}

function IconChevronRight({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function IconBack({ size = 18 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconClose({ size = 20 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconCheck({ size = 14 }) {
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconWallet({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="4" y="10" width="32" height="22" rx="4" stroke="currentColor" strokeWidth="2" />
      <rect x="24" y="18" width="8" height="6" rx="2" fill="currentColor" opacity="0.3" />
      <circle cx="28" cy="21" r="1.5" fill="currentColor" />
      <path d="M10 10V8a4 4 0 014-4h12a4 4 0 014 4v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// ─── Screen 0: Connect Wallet ───────────────────────────────

function ConnectScreen() {
  return (
    <div className="min-h-screen hero-mesh grid-bg flex items-center justify-center relative overflow-hidden">
      {/* Decorative orbs */}
      <div
        className="absolute w-72 h-72 rounded-full animate-float"
        style={{
          background: "radial-gradient(circle, rgba(0,229,160,0.12) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,156,255,0.08) 0%, transparent 70%)",
          bottom: "5%",
          right: "10%",
          filter: "blur(60px)",
          animationDelay: "1.5s",
        }}
      />

      <div className="text-center px-6 animate-fade-in-up relative z-10">
        <div className="mb-8">
          {/* Logo mark */}
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center animate-pulse-glow"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ color: "var(--accent)" }}>
              <IconWallet size={44} />
            </div>
          </div>

          <h1
            className="text-5xl font-extrabold tracking-tight mb-3"
            style={{ color: "var(--text-primary)" }}
          >
            Monad<span style={{ color: "var(--accent)" }}>Split</span>
          </h1>
          <p
            className="text-lg font-light max-w-xs mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            Split expenses with friends, settled on-chain
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <ConnectButton />
        </div>

        <p
          className="text-xs font-mono tracking-wider uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Powered by Monad Blockchain
        </p>
      </div>
    </div>
  );
}

// ─── Screen 1: Create Group ─────────────────────────────────

function CreateGroupScreen({ address, onGroupCreated, onCancel, hasGroups }) {
  const [groupName, setGroupName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [members, setMembers] = useState([]);
  const queryClient = useQueryClient();
  const { saveName, getName } = useAddressBook();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess && receipt) {
      const event = receipt.logs.find((log) => {
        try {
          decodeEventLog({
            abi: ExpenseGroupFactoryABI,
            data: log.data,
            topics: log.topics,
          });
          return true;
        } catch {
          return false;
        }
      });
      if (event) {
        const decoded = decodeEventLog({
          abi: ExpenseGroupFactoryABI,
          data: event.data,
          topics: event.topics,
        });
        onGroupCreated(decoded.args.groupAddress);
      }
      queryClient.invalidateQueries();
    }
  }, [isSuccess, receipt, queryClient, onGroupCreated]);

  function addMember() {
    const addr = memberInput.trim();
    if (!addr || !addr.startsWith("0x") || addr.length !== 42) return;
    if (members.find((m) => isAddr(m, addr)) || isAddr(addr, address)) return;
    if (nameInput.trim()) {
      saveName(addr, nameInput.trim());
    }
    setMembers([...members, addr]);
    setMemberInput("");
    setNameInput("");
  }

  function removeMember(addr) {
    setMembers(members.filter((m) => m !== addr));
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!groupName || members.length === 0) return;
    writeContract({
      address: FACTORY_ADDRESS,
      abi: ExpenseGroupFactoryABI,
      functionName: "createGroup",
      args: [groupName, members],
      gas: 3000000n,
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <p
              className="text-xs font-mono uppercase tracking-widest mb-0.5"
              style={{ color: "var(--accent)" }}
            >
              New Group
            </p>
            <h1 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              Create a Group
            </h1>
          </div>
          <ConnectButton accountStatus="avatar" chainStatus="icon" showBalance={false} />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 mt-4 animate-fade-in-up">
        <div className="glass-card-static p-6">
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Group name */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Weekend Trip, Dinner Squad"
                className="input-dark"
                autoFocus
              />
            </div>

            {/* Add members */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Add Members
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Name (e.g. Alice)"
                  className="input-dark text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    placeholder="Wallet address 0x..."
                    className="input-dark input-mono flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addMember();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addMember}
                    className="btn-accent px-5 py-3 text-sm flex items-center gap-1"
                  >
                    <IconPlus size={16} /> Add
                  </button>
                </div>
              </div>
            </div>

            {/* Members list */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Members ({members.length + 1})
              </p>
              <div className="space-y-2 stagger-children">
                {/* You - Creator */}
                <div
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: "var(--accent-glow)",
                    border: "1px solid rgba(0,229,160,0.2)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--accent)",
                      color: "var(--bg-primary)",
                    }}
                  >
                    Y
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
                      You
                    </p>
                    <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      {shortAddress(address)}
                    </p>
                  </div>
                  <span className="badge badge-accent">Creator</span>
                </div>

                {members.map((m) => {
                  const savedName = getName(m);
                  return (
                    <div
                      key={m}
                      className="flex items-center gap-3 rounded-xl px-4 py-3"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {savedName ? savedName[0].toUpperCase() : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-semibold truncate"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {savedName || "Unknown"}
                        </p>
                        <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {shortAddress(m)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(m)}
                        className="transition-colors"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => (e.target.style.color = "var(--danger)")}
                        onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
                      >
                        <IconClose size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || isConfirming || !groupName || members.length === 0}
              className="btn-accent w-full text-base"
            >
              {isPending
                ? "Confirm in wallet..."
                : isConfirming
                  ? "Creating on-chain..."
                  : "Create Group"}
            </button>

            {members.length === 0 && (
              <p
                className="text-xs text-center"
                style={{ color: "var(--warning)" }}
              >
                Add at least one other member to create a group
              </p>
            )}
          </form>

          {isSuccess && (
            <div
              className="mt-4 rounded-xl px-4 py-3 text-sm text-center font-semibold animate-slide-down"
              style={{
                background: "var(--positive-dim)",
                color: "var(--positive)",
                border: "1px solid rgba(0,229,160,0.2)",
              }}
            >
              Group created! Opening dashboard...
            </div>
          )}
        </div>

        {hasGroups && (
          <button
            onClick={onCancel}
            className="w-full text-sm mt-4 py-2 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.target.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
          >
            Back to my groups
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add Expense Card ───────────────────────────────────────

function AddExpenseCard({ groupAddress, members, currentUser, onDone }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [splitWith, setSplitWith] = useState(() =>
    members.map((m) => m.toLowerCase())
  );
  const queryClient = useQueryClient();

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDone = useCallback(() => onDone(), [onDone]);

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries();
      const timer = setTimeout(handleDone, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, queryClient, handleDone]);

  function toggleMember(addr) {
    const lower = addr.toLowerCase();
    if (isAddr(addr, currentUser)) return;
    if (splitWith.includes(lower)) {
      setSplitWith(splitWith.filter((m) => m !== lower));
    } else {
      setSplitWith([...splitWith, lower]);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !description) return;
    writeContract({
      address: groupAddress,
      abi: ExpenseGroupABI,
      functionName: "addExpense",
      args: [parseEther(amount), description],
    });
  }

  const splitCount = splitWith.length;
  const perPerson =
    amount && splitCount > 0
      ? (parseFloat(amount) / splitCount).toFixed(4)
      : "0";

  return (
    <div
      className="glass-card-static p-6 animate-slide-down"
      style={{ borderColor: "var(--accent)", borderWidth: "1px" }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          New Expense
        </h2>
        <button
          onClick={onDone}
          className="transition-colors p-1 rounded-lg"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <IconClose />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this for?"
            className="input-dark"
            autoFocus
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Amount (MON)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input-dark text-2xl font-bold"
          />
        </div>

        {/* Paid by */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Paid by
          </label>
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{
              background: "var(--accent-glow)",
              border: "1px solid rgba(0,229,160,0.2)",
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent)", color: "var(--bg-primary)" }}
            >
              Y
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
              You
            </span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {shortAddress(currentUser)}
            </span>
            <span className="ml-auto badge badge-accent">Settled</span>
          </div>
        </div>

        {/* Split among */}
        <div>
          <label
            className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-secondary)" }}
          >
            Split among ({splitCount} people &middot; {perPerson} MON each)
          </label>
          <div className="space-y-1.5">
            {members.filter((m) => !isAddr(m, currentUser)).map((m) => {
              const included = splitWith.includes(m.toLowerCase());
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMember(m)}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-left transition-all"
                  style={{
                    background: included ? "var(--bg-secondary)" : "transparent",
                    border: included
                      ? "1px solid var(--border-active)"
                      : "1px solid var(--border-subtle)",
                    opacity: included ? 1 : 0.45,
                  }}
                >
                  {/* Custom checkbox */}
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                    style={{
                      background: included ? "var(--accent)" : "transparent",
                      border: included ? "none" : "2px solid var(--border-subtle)",
                    }}
                  >
                    {included && (
                      <span style={{ color: "var(--bg-primary)" }}>
                        <IconCheck size={12} />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <DisplayName address={m} currentUser={currentUser} />
                  </div>
                  {included && amount && (
                    <span
                      className="text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {perPerson} MON
                    </span>
                  )}
                  {included && (
                    <span className="badge badge-warning">Pending</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming || !amount || !description}
          className="btn-accent w-full text-base"
        >
          {isPending
            ? "Confirm in wallet..."
            : isConfirming
              ? "Recording on-chain..."
              : "Add Expense"}
        </button>
      </form>

      {isSuccess && (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm text-center font-semibold animate-slide-down"
          style={{
            background: "var(--positive-dim)",
            color: "var(--positive)",
            border: "1px solid rgba(0,229,160,0.2)",
          }}
        >
          Expense recorded on-chain!
        </div>
      )}
    </div>
  );
}

// ─── Debt Computation ───────────────────────────────────────

function computeDebts(members, balances) {
  if (!members || !balances || members.length === 0) return [];
  const creditors = [];
  const debtors = [];
  for (let i = 0; i < members.length; i++) {
    const bal = balances[i] || 0n;
    if (bal > 0n) creditors.push({ address: members[i], amount: bal });
    else if (bal < 0n) debtors.push({ address: members[i], amount: -bal });
  }
  const debts = [];
  let ci = 0,
    di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const payment =
      debtors[di].amount < creditors[ci].amount
        ? debtors[di].amount
        : creditors[ci].amount;
    debts.push({
      from: debtors[di].address,
      to: creditors[ci].address,
      amount: payment,
    });
    debtors[di].amount -= payment;
    creditors[ci].amount -= payment;
    if (debtors[di].amount === 0n) di++;
    if (creditors[ci].amount === 0n) ci++;
  }
  return debts;
}

// ─── Balances & Settlement ──────────────────────────────────

function BalancesSection({
  members,
  balances,
  debts,
  currentUser,
  onSettle,
  isSettling,
  isSettleSuccess,
}) {
  if (members.length === 0) return null;

  return (
    <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
        Balances
      </h2>

      <div className="space-y-2 mb-5">
        {members.map((member, i) => {
          const balance = balances[i] || 0n;
          const positive = balance > 0n;
          const zero = balance === 0n;

          return (
            <div
              key={member}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                background: zero
                  ? "var(--bg-secondary)"
                  : positive
                    ? "var(--positive-dim)"
                    : "var(--negative-dim)",
                border: `1px solid ${
                  zero
                    ? "var(--border-subtle)"
                    : positive
                      ? "rgba(0,229,160,0.15)"
                      : "rgba(255,77,106,0.15)"
                }`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="status-dot"
                  style={{
                    background: zero
                      ? "var(--text-muted)"
                      : positive
                        ? "var(--positive)"
                        : "var(--negative)",
                  }}
                />
                <span className="text-sm">
                  <DisplayName address={member} currentUser={currentUser} />
                </span>
              </div>
              <div className="text-right">
                <p
                  className="text-sm font-bold"
                  style={{
                    color: zero
                      ? "var(--text-muted)"
                      : positive
                        ? "var(--positive)"
                        : "var(--negative)",
                  }}
                >
                  {zero
                    ? "Settled"
                    : positive
                      ? `+${formatEther(balance)} MON`
                      : `${formatEther(balance)} MON`}
                </p>
                {!zero && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {positive ? "gets back" : "needs to pay"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {debts.length > 0 && (
        <>
          <div className="flex items-center gap-2.5 mb-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
              Settlement Plan
            </h3>
            <span className="badge badge-warning">
              {debts.length} payment{debts.length > 1 ? "s" : ""} needed
            </span>
          </div>
          <div className="space-y-2">
            {debts.map((debt, i) => {
              const youOwe = isAddr(debt.from, currentUser);
              const owedToYou = isAddr(debt.to, currentUser);
              return (
                <div
                  key={i}
                  className="rounded-xl px-4 py-3"
                  style={{
                    background: youOwe
                      ? "var(--negative-dim)"
                      : owedToYou
                        ? "var(--positive-dim)"
                        : "var(--bg-secondary)",
                    border: `1px solid ${
                      youOwe
                        ? "rgba(255,77,106,0.15)"
                        : owedToYou
                          ? "rgba(0,229,160,0.15)"
                          : "var(--border-subtle)"
                    }`,
                  }}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span>
                      <DisplayName address={debt.from} currentUser={currentUser} />
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      <IconArrowRight />
                    </span>
                    <span>
                      <DisplayName address={debt.to} currentUser={currentUser} />
                    </span>
                    <span
                      className="ml-auto font-bold font-mono whitespace-nowrap"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatEther(debt.amount)} MON
                    </span>
                  </div>
                  {youOwe && (
                    <button
                      onClick={() => onSettle(debt.to, debt.amount)}
                      disabled={isSettling}
                      className="mt-2.5 w-full text-sm font-bold py-2.5 rounded-lg transition-all"
                      style={{
                        background: "var(--danger)",
                        color: "#fff",
                        opacity: isSettling ? 0.5 : 1,
                      }}
                    >
                      {isSettling
                        ? "Processing..."
                        : `Pay ${formatEther(debt.amount)} MON`}
                    </button>
                  )}
                  {owedToYou && (
                    <p
                      className="mt-1.5 text-xs font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      Waiting for their payment
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {debts.length === 0 && (
        <div
          className="text-center py-3 rounded-xl"
          style={{
            background: "var(--positive-dim)",
            border: "1px solid rgba(0,229,160,0.15)",
          }}
        >
          <p className="font-semibold text-sm" style={{ color: "var(--positive)" }}>
            All settled up!
          </p>
        </div>
      )}

      {isSettleSuccess && (
        <div
          className="mt-3 rounded-xl px-4 py-3 text-sm text-center font-semibold animate-slide-down"
          style={{
            background: "var(--positive-dim)",
            color: "var(--positive)",
            border: "1px solid rgba(0,229,160,0.2)",
          }}
        >
          Payment sent!
        </div>
      )}
    </div>
  );
}

// ─── Expense History ────────────────────────────────────────

function ExpenseHistory({ expenses, members, memberCount, currentUser }) {
  if (expenses.length === 0) {
    return (
      <div className="glass-card-static p-6 text-center animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        <p style={{ color: "var(--text-muted)" }} className="text-sm">
          No expenses yet
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-static p-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
      <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
        Expense History
      </h2>
      <div className="space-y-3">
        {expenses.map((expense, i) => {
          const paidByYou = isAddr(expense.paidBy, currentUser);
          const perPerson =
            memberCount > 0 ? expense.totalAmount / BigInt(memberCount) : 0n;

          return (
            <div
              key={i}
              className="rounded-xl px-4 py-4"
              style={{
                background: paidByYou ? "var(--accent-glow)" : "var(--bg-secondary)",
                border: paidByYou
                  ? "1px solid rgba(0,229,160,0.15)"
                  : "1px solid var(--border-subtle)",
              }}
            >
              <div className="flex items-start justify-between mb-2.5">
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                    {expense.description}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {format(
                      new Date(Number(expense.timestamp) * 1000),
                      "MMM d, yyyy · h:mm a"
                    )}
                  </p>
                </div>
                <p className="font-bold text-lg" style={{ color: "var(--accent)" }}>
                  {formatEther(expense.totalAmount)}{" "}
                  <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                    MON
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-1.5 mb-2.5">
                <span className={`badge ${paidByYou ? "badge-accent" : "badge-neutral"}`}>
                  {paidByYou ? "You paid" : "Paid by"}
                </span>
                {!paidByYou && (
                  <span className="text-xs">
                    <DisplayName
                      address={expense.paidBy}
                      currentUser={currentUser}
                    />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {members.map((m) => {
                  const memberPaid = isAddr(m, expense.paidBy);
                  return (
                    <span
                      key={m}
                      className="text-xs px-2.5 py-1 rounded-lg inline-flex items-center gap-1"
                      style={{
                        background: memberPaid
                          ? "var(--positive-dim)"
                          : "var(--negative-dim)",
                        color: memberPaid
                          ? "var(--positive)"
                          : "var(--negative)",
                      }}
                    >
                      <DisplayName address={m} currentUser={currentUser} />
                      <span className="font-mono">{formatEther(perPerson)}</span>
                      <span className="font-bold">
                        {memberPaid ? "✓" : "○"}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Group Dashboard ────────────────────────────────────────

function GroupDashboard({ address, groupAddress, onBack, autoAddExpense }) {
  const [showAddExpense, setShowAddExpense] = useState(autoAddExpense);
  const queryClient = useQueryClient();

  const { data: groupName } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "groupName",
  });

  const { data: members } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "getMembers",
  });

  const { data: balancesData } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "getBalances",
  });

  const { data: expenses } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "getAllExpenses",
  });

  const balanceMembers = balancesData?.[0] || [];
  const balanceValues = balancesData?.[1] || [];
  const sortedExpenses = expenses ? [...expenses].reverse() : [];
  const memberCount = members?.length || 0;
  const debts = computeDebts([...balanceMembers], [...balanceValues]);

  const {
    writeContract: settleWrite,
    data: settleHash,
    isPending: isSettling,
  } = useWriteContract();
  const { isLoading: isSettleConfirming, isSuccess: isSettleSuccess } =
    useWaitForTransactionReceipt({ hash: settleHash });

  useEffect(() => {
    if (isSettleSuccess) {
      queryClient.invalidateQueries();
    }
  }, [isSettleSuccess, queryClient]);

  const totalSpent = sortedExpenses.length > 0
    ? formatEther(sortedExpenses.reduce((sum, e) => sum + e.totalAmount, 0n))
    : "0";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center justify-between mb-1">
            <button
              onClick={onBack}
              className="text-sm flex items-center gap-1 transition-colors"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
            >
              <IconBack />
              Groups
            </button>
            <ConnectButton
              accountStatus="avatar"
              chainStatus="icon"
              showBalance={false}
            />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {groupName || "Loading..."}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {memberCount} members
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 space-y-4 mt-2">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in-up">
          {[
            { value: memberCount, label: "Members" },
            { value: sortedExpenses.length, label: "Expenses" },
            { value: totalSpent, label: "Total MON" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card-static p-3.5 text-center"
            >
              <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Add Expense */}
        {!showAddExpense ? (
          <button
            onClick={() => setShowAddExpense(true)}
            className="btn-accent w-full flex items-center justify-center gap-2 text-base animate-fade-in-up"
          >
            <IconPlus /> Add Expense
          </button>
        ) : (
          <AddExpenseCard
            groupAddress={groupAddress}
            members={members || []}
            currentUser={address}
            onDone={() => setShowAddExpense(false)}
          />
        )}

        {/* Balances & Settlement — only show when there are expenses */}
        {sortedExpenses.length > 0 && (
          <BalancesSection
            members={balanceMembers}
            balances={balanceValues}
            debts={debts}
            currentUser={address}
            onSettle={(creditor, amount) => {
              settleWrite({
                address: groupAddress,
                abi: ExpenseGroupABI,
                functionName: "settleDebt",
                args: [creditor],
                value: amount,
              });
            }}
            isSettling={isSettling || isSettleConfirming}
            isSettleSuccess={isSettleSuccess}
          />
        )}

        {/* Expense History — only show when there are expenses */}
        {sortedExpenses.length > 0 && (
          <ExpenseHistory
            expenses={sortedExpenses}
            members={members || []}
            memberCount={memberCount}
            currentUser={address}
          />
        )}
      </div>
    </div>
  );
}

// ─── Group List ─────────────────────────────────────────────

function GroupCard({ groupAddress, currentUser, onClick }) {
  const { data: name } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "groupName",
  });

  const { data: members } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "getMembers",
  });

  const { data: balancesData } = useReadContract({
    address: groupAddress,
    abi: ExpenseGroupABI,
    functionName: "getBalances",
  });

  const balanceMembers = balancesData?.[0] || [];
  const balanceValues = balancesData?.[1] || [];
  const myIdx = balanceMembers.findIndex((m) => isAddr(m, currentUser));
  const myBalance = myIdx >= 0 ? balanceValues[myIdx] : 0n;

  return (
    <button
      onClick={onClick}
      className="glass-card w-full p-5 text-left group"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>
          {name || "Loading..."}
        </h3>
        <span
          className="transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          <IconChevronRight />
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {members?.length || 0} members
        </span>
        {myBalance !== 0n && (
          <span
            className={`badge ${myBalance > 0n ? "badge-accent" : "badge-danger"}`}
          >
            {myBalance > 0n
              ? `Owed ${formatEther(myBalance)} MON`
              : `Owe ${formatEther(-myBalance)} MON`}
          </span>
        )}
        {myBalance === 0n && balanceMembers.length > 0 && (
          <span className="badge badge-neutral">Settled</span>
        )}
      </div>
    </button>
  );
}

function GroupList({ address, groups, onSelectGroup, onCreateNew }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div className="max-w-lg mx-auto px-5 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              Monad<span style={{ color: "var(--accent)" }}>Split</span>
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {groups.length} group{groups.length !== 1 ? "s" : ""}
            </p>
          </div>
          <ConnectButton
            accountStatus="avatar"
            chainStatus="icon"
            showBalance={false}
          />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-5 mt-2 space-y-3 stagger-children">
        {/* Create New button */}
        <button
          onClick={onCreateNew}
          className="w-full p-5 flex items-center gap-4 rounded-2xl transition-all group"
          style={{
            background: "transparent",
            border: "2px dashed var(--border-subtle)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent)";
            e.currentTarget.style.background = "var(--accent-glow)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            style={{
              background: "var(--bg-card)",
              color: "var(--accent)",
            }}
          >
            <IconPlus size={24} />
          </div>
          <div className="text-left">
            <p className="font-semibold" style={{ color: "var(--accent)" }}>
              Create New Group
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Add members and start splitting
            </p>
          </div>
        </button>

        {groups.map((groupAddr) => (
          <GroupCard
            key={groupAddr}
            groupAddress={groupAddr}
            currentUser={address}
            onClick={() => onSelectGroup(groupAddr)}
          />
        ))}

        {groups.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No groups yet. Create your first one!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── App Root ───────────────────────────────────────────────

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [screen, setScreen] = useState("list");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [autoAddExpense, setAutoAddExpense] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userGroups } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: ExpenseGroupFactoryABI,
    functionName: "getUserGroups",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const groups = userGroups || [];

  // Auto-redirect to create if no groups
  useEffect(() => {
    if (mounted && isConnected && groups.length === 0 && screen === "list") {
      setScreen("create");
    }
  }, [mounted, isConnected, groups.length, screen]);

  if (!mounted) return null;
  if (!isConnected) return <ConnectScreen />;

  if (screen === "create") {
    return (
      <CreateGroupScreen
        address={address}
        hasGroups={groups.length > 0}
        onGroupCreated={(addr) => {
          setSelectedGroup(addr);
          setAutoAddExpense(true);
          setScreen("dashboard");
        }}
        onCancel={() => setScreen("list")}
      />
    );
  }

  if (screen === "dashboard" && selectedGroup) {
    return (
      <GroupDashboard
        address={address}
        groupAddress={selectedGroup}
        autoAddExpense={autoAddExpense}
        onBack={() => {
          setSelectedGroup(null);
          setAutoAddExpense(false);
          setScreen("list");
        }}
      />
    );
  }

  return (
    <GroupList
      address={address}
      groups={groups}
      onSelectGroup={(addr) => {
        setSelectedGroup(addr);
        setAutoAddExpense(false);
        setScreen("dashboard");
      }}
      onCreateNew={() => setScreen("create")}
    />
  );
}
