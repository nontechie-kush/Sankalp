revoke all on function public.pay_my_mweb_booking(uuid, uuid) from public, anon, authenticated;
revoke all on function public.mock_pay_authenticated_mweb_booking(uuid, uuid) from public, anon, authenticated;
revoke all on function public.create_authenticated_mweb_booking(uuid, uuid, uuid, uuid, text, text) from public, anon, authenticated;
