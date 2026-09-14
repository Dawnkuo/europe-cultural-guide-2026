# Open Heritage 3D Trial

Checked 2026-09-14. Scope: standalone `/models/` trial links only. Existing
guide renderers, local models, offline caches and itinerary were not changed.
No deployment, raw dataset download, form submission or account creation.

## Verified Sources

| Site | Published data | License shown | Result |
| --- | --- | --- | --- |
| [Pantheon](https://openheritage3d.org/project.php?id=t9sj-mf53) | Terrestrial LiDAR, 0.1 GB | CC BY-NC-SA | Public point-cloud viewer rendered the rotunda, dome and portico. Captured 2005-2008; published 2021. Dataset is a single merged cloud, not an inspected textured mesh. |
| [Piazza del Duomo, Pisa](https://openheritage3d.org/project.php?id=dbg6-x966) | Terrestrial LiDAR, 2.37 GB | CC BY-NC-SA | Public viewer rendered. Survey focuses on cathedral, campanile and baptistery exteriors. Visible sparse regions and gaps in initial preview. |
| [Florence Baptistery, 2014](https://openheritage3d.org/project.php?id=0x6p-vk89) | LiDAR 19.2 GB; photogrammetry 37.3 GB | CC BY-NC | Metadata checked, viewer not visually tested. Curator flags misaligned/layered floors; do not use as an already validated mesh. |
| [San Lorenzo in Miranda / Temple of Antonino and Faustina](https://openheritage3d.org/project.php?id=yf3n-hj29) | Aerial photogrammetry 1.78 GB; LiDAR 164 GB | CC BY-NC | Metadata checked only. This is one Forum building, not the entire Forum or Colosseum. |

The [FAQ](https://openheritage3d.org/faq) says downloads require no account:
the user supplies name, organization and email and receives download links by
email. License terms are dataset-specific. Do not bypass that workflow or
extract viewer assets as a substitute for the authorized download.

## Actual Viewer Trial

- [Pantheon viewer](https://pointcloud.ucsd.edu/archive_temp/oh3d_store/oh3d-vis/base_potree_template/?vtype=oh3d&doi=t9sj-mf53)
- [Pisa viewer](https://pointcloud.ucsd.edu/archive_temp/oh3d_store/oh3d-vis/base_potree_template/?doi=dbg6-x966&vtype=oh3d)
- Both rendered anonymously in Chrome. Both also logged a third-party error:
  `Cannot set properties of undefined (setting 'enabled')`; rendering succeeded,
  but not every external tool/control has been validated.
- The trial is a remote point-cloud view. No mesh reconstruction, texture
  baking, GLB export, offline packaging or street alignment has been performed.
- These datasets can inform later reconstruction, but do not establish that
  every scanned surface is complete or that a resulting mesh is ready to ship.
