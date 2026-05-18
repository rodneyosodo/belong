alter table "relationships" drop constraint if exists "relationships_type_check";
alter table "relationships" add constraint "relationships_type_check" check ("type" in ('parent', 'child', 'spouse', 'sibling', 'adopted', 'adopted-parent', 'step-parent', 'step-child', 'half-sibling'));
