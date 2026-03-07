import { useState, useRef, useEffect } from 'react'
import { useTeamStore } from '../store/teamStore'

export default function SearchBar({ value, onChange, filters, onFilterChange }) {
  const members   = useTeamStore((s) => s.members)
  const [open, setOpen] = useState(false)
  const ref       = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeFilterCount = Object.values(filters).filter(Boolean).length

  const clearAll = () => {
    onChange('')
    onFilterChange({ priority: '', assignee: '', creator: '', due: '' })
  }

  const hasAny = value || activeFilterCount > 0

  return (
    <>
      <style>{`
        .search-bar-root {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 32px;
          background: #f0efe9;
          border-bottom: 1px solid #d6d3cc;
          flex-shrink: 0;
        }

        .search-input-wrap {
          position: relative;
          flex: 1;
          max-width: 360px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 13px;
          pointer-events: none;
          font-family: var(--mono);
        }

        .search-input {
          width: 100%;
          padding: 7px 10px 7px 30px;
          font-size: 12px;
          font-family: var(--sans);
          color: var(--dark);
          background: #ffffff;
          border: 1px solid #d6d3cc;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }

        .search-input:focus { border-color: var(--dark); }
        .search-input::placeholder { color: #b0ada6; }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 12px;
          font-size: 11px;
          font-family: var(--mono);
          font-weight: 500;
          color: #6b7280;
          background: #ffffff;
          border: 1px solid #d6d3cc;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .filter-btn:hover { border-color: var(--dark); color: var(--dark); }

        .filter-btn.has-filters {
          background: var(--dark);
          color: var(--cream);
          border-color: var(--dark);
        }

        .filter-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          background: var(--cream);
          color: var(--dark);
          font-size: 9px;
          font-weight: 700;
          border-radius: 50%;
        }

        .filter-btn.has-filters .filter-badge {
          background: #ffffff;
          color: var(--dark);
        }

        /* Dropdown panel */
        .filter-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          z-index: 200;
          background: #f5f4f0;
          border: 1px solid #d6d3cc;
          width: 280px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }

        .filter-dropdown-header {
          height: 36px;
          padding: 0 14px;
          background: var(--dark);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .filter-dropdown-title {
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 500;
          color: var(--cream);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .filter-clear-btn {
          font-family: var(--mono);
          font-size: 9px;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: 0.04em;
          transition: color 0.15s;
          padding: 0;
        }

        .filter-clear-btn:hover { color: var(--cream); }

        .filter-dropdown-body {
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .filter-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .filter-label {
          font-family: var(--mono);
          font-size: 9px;
          font-weight: 500;
          color: #9ca3af;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .filter-select {
          width: 100%;
          padding: 7px 10px;
          font-size: 12px;
          font-family: var(--sans);
          color: var(--dark);
          background: #ffffff;
          border: 1px solid #d6d3cc;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          transition: border-color 0.15s;
        }

        .filter-select:focus { border-color: var(--dark); }

        .clear-all-btn {
          padding: 6px 14px;
          font-size: 11px;
          font-weight: 500;
          font-family: var(--mono);
          color: #9ca3af;
          background: none;
          border: none;
          cursor: pointer;
          letter-spacing: 0.03em;
          transition: color 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .clear-all-btn:hover { color: var(--dark); }

        .active-filter-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          background: var(--dark);
          color: var(--cream);
          font-family: var(--mono);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }

        .active-filter-pill button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          padding: 0;
          transition: color 0.15s;
        }

        .active-filter-pill button:hover { color: var(--cream); }
      `}</style>

      <div className="search-bar-root">
        {/* Search input */}
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            className="search-input"
            placeholder="Search tasks…"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>

        {/* Filter button + dropdown */}
        <div style={{ position: 'relative' }} ref={ref}>
          <button
            className={`filter-btn ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            onClick={() => setOpen((o) => !o)}
          >
            Filters
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </button>

          {open && (
            <div className="filter-dropdown">
              <div className="filter-dropdown-header">
                <span className="filter-dropdown-title">Filter Tasks</span>
                {activeFilterCount > 0 && (
                  <button
                    className="filter-clear-btn"
                    onClick={() => onFilterChange({ priority: '', assignee: '', creator: '', due: '' })}
                  >
                    clear all
                  </button>
                )}
              </div>
              <div className="filter-dropdown-body">

                {/* Priority */}
                <div className="filter-row">
                  <span className="filter-label">Priority</span>
                  <select
                    className="filter-select"
                    value={filters.priority}
                    onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
                  >
                    <option value="">Any priority</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Assignee */}
                <div className="filter-row">
                  <span className="filter-label">Assignee</span>
                  <select
                    className="filter-select"
                    value={filters.assignee}
                    onChange={(e) => onFilterChange({ ...filters, assignee: e.target.value })}
                  >
                    <option value="">Any assignee</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.username || m.email.split('@')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Creator */}
                <div className="filter-row">
                  <span className="filter-label">Creator</span>
                  <select
                    className="filter-select"
                    value={filters.creator}
                    onChange={(e) => onFilterChange({ ...filters, creator: e.target.value })}
                  >
                    <option value="">Any creator</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.username || m.email.split('@')[0]}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Due date */}
                <div className="filter-row">
                  <span className="filter-label">Due Date</span>
                  <select
                    className="filter-select"
                    value={filters.due}
                    onChange={(e) => onFilterChange({ ...filters, due: e.target.value })}
                  >
                    <option value="">Any date</option>
                    <option value="overdue">Overdue</option>
                    <option value="today">Due today</option>
                    <option value="week">Due this week</option>
                    <option value="none">No due date</option>
                  </select>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* Active filter pills */}
        {filters.priority && (
          <span className="active-filter-pill">
            {filters.priority}
            <button onClick={() => onFilterChange({ ...filters, priority: '' })}>×</button>
          </span>
        )}
        {filters.assignee && (
          <span className="active-filter-pill">
            @{members.find((m) => String(m.id) === filters.assignee)?.username
              || members.find((m) => String(m.id) === filters.assignee)?.email.split('@')[0]
              || 'assignee'}
            <button onClick={() => onFilterChange({ ...filters, assignee: '' })}>×</button>
          </span>
        )}
        {filters.creator && (
          <span className="active-filter-pill">
            by {members.find((m) => String(m.id) === filters.creator)?.username
              || members.find((m) => String(m.id) === filters.creator)?.email.split('@')[0]
              || 'creator'}
            <button onClick={() => onFilterChange({ ...filters, creator: '' })}>×</button>
          </span>
        )}
        {filters.due && (
          <span className="active-filter-pill">
            {filters.due === 'overdue' ? 'overdue'
              : filters.due === 'today' ? 'due today'
              : filters.due === 'week'  ? 'due this week'
              : 'no due date'}
            <button onClick={() => onFilterChange({ ...filters, due: '' })}>×</button>
          </span>
        )}

        {/* Clear all */}
        {hasAny && (
          <button className="clear-all-btn" onClick={clearAll}>
            clear
          </button>
        )}
      </div>
    </>
  )
}