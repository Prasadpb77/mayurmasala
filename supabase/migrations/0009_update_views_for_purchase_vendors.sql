-- Update views to use purchase_vendors table for purchase calculations
-- This combines purchase_vendors with transactions for profit/loss calculations

-- Drop existing views
drop view if exists v_monthly_summary cascade;
drop view if exists v_yearly_summary cascade;
drop view if exists v_fy_summary cascade;

-- Monthly summary: combine transactions with purchase_vendors
create view v_monthly_summary as
select
  date_trunc('month', txn_date)::date as period,
  type,
  sum(amount) as total
from (
  select txn_date as date, 'sale' as type, amount from transactions where type = 'sale'
  union all
  select date::date as date, 'purchase' as type, amount from purchase_vendors
  union all
  select txn_date as date, 'expense' as type, amount from transactions where type = 'expense'
) combined
group by period, type
order by period desc;

-- Yearly summary
create view v_yearly_summary as
select
  date_trunc('year', date)::date as period,
  type,
  sum(amount) as total
from (
  select txn_date as date, 'sale' as type, amount from transactions where type = 'sale'
  union all
  select date::date as date, 'purchase' as type, amount from purchase_vendors
  union all
  select txn_date as date, 'expense' as type, amount from transactions where type = 'expense'
) combined
group by period, type
order by period desc;

-- Financial year summary (Apr-Mar)
create view v_fy_summary as
select
  concat(
    extract(year from date + interval '92 days')::text,
    '-',
    extract(year from date + interval '92 days') + 1,
    '03'
  ) as fin_year,
  type,
  sum(amount) as total
from (
  select txn_date as date, 'sale' as type, amount from transactions where type = 'sale'
  union all
  select date::date as date, 'purchase' as type, amount from purchase_vendors
  union all
  select txn_date as date, 'expense' as type, amount from transactions where type = 'expense'
) combined
group by fin_year, type
order by fin_year desc;