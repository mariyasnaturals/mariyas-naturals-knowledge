#!/usr/bin/python3
"""Local-only rehearsal with the actual compiled archive; ALL writes are inside TemporaryDirectory."""
import contextlib
import io
import json
from pathlib import Path
import subprocess
import tempfile
import prepare_release
import pull_deploy as pull


def main():
    root = Path(__file__).resolve().parent.parent
    review = json.loads((root / 'review-artifacts/review-manifest.json').read_text())
    with tempfile.TemporaryDirectory(prefix='mariyas-pull-rehearsal-') as work:
        work = Path(work)
        key, public = work / 'fixture-private.pem', work / 'fixture-public.pem'
        subprocess.run(['openssl', 'genpkey', '-algorithm', 'ED25519', '-out', str(key)], check=True, capture_output=True)
        subprocess.run(['openssl', 'pkey', '-in', str(key), '-pubout', '-out', str(public)], check=True, capture_output=True)
        website, state = work / 'website', work / 'state'
        website.mkdir()
        state.mkdir(mode=0o700)
        (website / 'index.html').write_text('previous fixture staging page')
        (website / '.well-known').mkdir()
        (website / '.well-known/token').write_text('preserve ACME fixture')
        cfg = {'_root': website, '_state': state, 'enabled': False, 'release_public_key': str(public)}
        with contextlib.redirect_stdout(io.StringIO()):
            prepare_release.prepare(root / 'review-artifacts', work / 'release', review['sourceSha'], 1, key)
            manifest, signature_hash, staged = pull.verify_release(work / 'release', cfg)
            before = {p.relative_to(website).as_posix(): p.read_bytes() for p in website.rglob('*') if p.is_file()}
            pull.apply_release(cfg, manifest, signature_hash, staged, 'b' * 40)
            after = {p.relative_to(website).as_posix(): p.read_bytes() for p in website.rglob('*') if p.is_file()}
            assert before == after and not (state / 'backups').exists()
            cfg['enabled'] = True
            pull.atomic_json(state / 'initial-approval.json', {'manifest_sha256': signature_hash, 'inventory_sha256': pull.inventory_hash(pull.static_inventory(website))})
            pull.apply_release(cfg, manifest, signature_hash, staged, 'b' * 40, True)
            current = pull.read_json(state / 'current.json')
            pull.verify_backup(state / 'backups' / current['backup'])
            assert (website / '.well-known/token').read_text() == 'preserve ACME fixture'
            pull.rollback(cfg, current['backup'], True)
            assert (website / 'index.html').read_text() == 'previous fixture staging page'
            pull.apply_release(cfg, manifest, signature_hash, staged, 'b' * 40, True)
            assert (website / 'index.html').read_text() == 'previous fixture staging page'
        report = {'scope': 'Local temporary directories only; no VPS connection/configuration and no real release branch publication.', 'compiled_source_sha': review['sourceSha'], 'archive_sha256': review['archiveSha256'], 'compiled_files_verified': len(manifest['files']), 'approved_image_derivatives_verified': len(manifest['approved_images']), 'signature': 'Ed25519 test key generated locally and destroyed', 'dry_run_website_bytes_unchanged': before == after, 'dry_run_backups_created': False, 'simulated_apply_verified_backup_first': True, 'well_known_preserved': True, 'simulated_rollback_restored_previous_page': True, 'poll_did_not_undo_rollback': True, 'network_fetch': 'Not exercised against GitHub/VPS; requires owner-installed deploy key and pinned host trust', 'production_deployment': False}
    (root / 'docs/pull-dry-run.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    main()
