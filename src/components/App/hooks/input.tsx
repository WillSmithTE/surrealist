import { type HotkeyItem, useHotkeys } from "@mantine/hooks";
import { useEffect, useMemo } from "react";
import { useCommandDispatcher, useCommandKeybinds } from "~/providers/Commands";
import { translateBinding } from "~/providers/Commands/keybindings";
import { isModKey } from "~/util/helpers";

/**
 * Track the state of the mod key
 */
export function useModKeyTracker() {
	useEffect(() => {
		const onKeyDown = (e: Event) => {
			if (isModKey(e)) {
				document.body.classList.add("mod");
			}
		};

		const onKeyUp = (e: Event) => {
			if (isModKey(e)) {
				document.body.classList.remove("mod");
			}
		};

		document.body.addEventListener("blur", onKeyDown);
		document.body.addEventListener("keydown", onKeyDown);
		document.body.addEventListener("keyup", onKeyUp);

		return () => {
			document.body.removeEventListener("blur", onKeyDown);
			document.body.removeEventListener("keydown", onKeyDown);
			document.body.removeEventListener("keyup", onKeyUp);
		};
	}, []);
}

/**
 * Listen for keybinds and dispatch commands
 */
export function useKeybindListener() {
	const keybinds = useCommandKeybinds();
	const dispatch = useCommandDispatcher();

	// Derive a stable key from the keybinds map so that the hotkeys
	// array is only recreated when the actual bindings change, not
	// when the Map reference changes due to unrelated re-renders.
	// This prevents Mantine's useHotkeys from constantly unmounting
	// and remounting its document-level keydown listener, which can
	// cause keyboard events to be lost during the re-registration.
	const bindingsKey = useMemo(() => {
		return Array.from(keybinds.entries())
			.map(([cmd, binding]) => `${cmd}:${binding.join("+")}`)
			.sort()
			.join("|");
	}, [keybinds]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: keybinds is tracked via bindingsKey for referential stability
	const hotkeys = useMemo(() => {
		return Array.from(keybinds.entries()).map(([cmd, binding]) => {
			return [
				translateBinding(binding),
				() => dispatch(cmd),
				{ preventDefault: true },
			] as HotkeyItem;
		});
	}, [bindingsKey, dispatch]);

	useHotkeys(hotkeys, [], true);
}
