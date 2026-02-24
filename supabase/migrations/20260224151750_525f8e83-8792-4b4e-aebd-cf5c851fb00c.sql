
-- Admin write policies for catalog_profiles
CREATE POLICY "Admins manage profiles"
ON public.catalog_profiles
FOR ALL
USING (
  catalog_version_id IN (
    SELECT id FROM catalog_versions WHERE company_id = get_user_company_id()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  catalog_version_id IN (
    SELECT id FROM catalog_versions WHERE company_id = get_user_company_id()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admin write policies for skus
CREATE POLICY "Admins manage skus"
ON public.skus
FOR ALL
USING (
  catalog_version_id IN (
    SELECT id FROM catalog_versions WHERE company_id = get_user_company_id()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  catalog_version_id IN (
    SELECT id FROM catalog_versions WHERE company_id = get_user_company_id()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Admin write policies for rules
CREATE POLICY "Admins manage rules"
ON public.rules
FOR ALL
USING (
  catalog_version_id IN (
    SELECT id FROM catalog_versions WHERE company_id = get_user_company_id()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  catalog_version_id IN (
    SELECT id FROM catalog_versions WHERE company_id = get_user_company_id()
  )
  AND has_role(auth.uid(), 'admin'::app_role)
);
