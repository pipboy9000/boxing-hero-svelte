
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.23.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules\svelte-spa-router\Router.svelte generated by Svelte v3.23.2 */

    const { Error: Error_1, Object: Object_1, console: console_1 } = globals;

    // (219:0) {:else}
    function create_else_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[5]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[5]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(219:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (217:0) {#if componentParams}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[4]);
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[4]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(217:0) {#if componentParams}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function wrap(route, userData, ...conditions) {
    	// Check if we don't have userData
    	if (userData && typeof userData == "function") {
    		conditions = conditions && conditions.length ? conditions : [];
    		conditions.unshift(userData);
    		userData = undefined;
    	}

    	// Parameter route and each item of conditions must be functions
    	if (!route || typeof route != "function") {
    		throw Error("Invalid parameter route");
    	}

    	if (conditions && conditions.length) {
    		for (let i = 0; i < conditions.length; i++) {
    			if (!conditions[i] || typeof conditions[i] != "function") {
    				throw Error("Invalid parameter conditions[" + i + "]");
    			}
    		}
    	}

    	// Returns an object that contains all the functions to execute too
    	const obj = { route, userData };

    	if (conditions && conditions.length) {
    		obj.conditions = conditions;
    	}

    	// The _sveltesparouter flag is to confirm the object was created by this router
    	Object.defineProperty(obj, "_sveltesparouter", { value: true });

    	return obj;
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return tick().then(() => {
    		window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    	});
    }

    function pop() {
    	// Execute this code when the current call stack is complete
    	return tick().then(() => {
    		window.history.back();
    	});
    }

    function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	return tick().then(() => {
    		const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    		try {
    			window.history.replaceState(undefined, undefined, dest);
    		} catch(e) {
    			// eslint-disable-next-line no-console
    			console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    		}

    		// The method above doesn't trigger the hashchange event, so let's do that manually
    		window.dispatchEvent(new Event("hashchange"));
    	});
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);
    }

    function nextTickPromise(cb) {
    	// eslint-disable-next-line no-console
    	console.warn("nextTickPromise from 'svelte-spa-router' is deprecated and will be removed in version 3; use the 'tick' method from the Svelte runtime instead");

    	return tick().then(cb);
    }

    function instance($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(6, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent} component - Svelte component for the route
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, remove it before we run the matching
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {SvelteComponent} component - Svelte component
     * @property {string} name - Name of the Svelte component
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {Object} [userData] - Custom data passed by the user
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	const dispatchNextTick = (name, detail) => {
    		// Execute this code when the current call stack is complete
    		tick().then(() => {
    			dispatch(name, detail);
    		});
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => ({
    		readable,
    		derived,
    		tick,
    		wrap,
    		getLocation,
    		loc,
    		location,
    		querystring,
    		push,
    		pop,
    		replace,
    		link,
    		updateLink,
    		nextTickPromise,
    		createEventDispatcher,
    		regexparam,
    		routes,
    		prefix,
    		RouteItem,
    		routesList,
    		component,
    		componentParams,
    		dispatch,
    		dispatchNextTick,
    		$loc
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 65) {
    			// Handle hash change events
    			// Listen to changes in the $loc store and update the page
    			 {
    				// Find a route matching the location
    				$$invalidate(0, component = null);

    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						// Check if the route can be loaded - if all conditions succeed
    						if (!routesList[i].checkConditions(detail)) {
    							// Trigger an event to notify the user
    							dispatchNextTick("conditionsFailed", detail);

    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);

    						// Set componentParams onloy if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    						// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    						if (match && typeof match == "object" && Object.keys(match).length) {
    							$$invalidate(1, componentParams = match);
    						} else {
    							$$invalidate(1, componentParams = null);
    						}

    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [
    		component,
    		componentParams,
    		routes,
    		prefix,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Menu.svelte generated by Svelte v3.23.2 */
    const file = "src\\Menu.svelte";

    function create_fragment$1(ctx) {
    	let div7;
    	let div0;
    	let t0;
    	let hr0;
    	let t1;
    	let div6;
    	let div1;
    	let t3;
    	let div2;
    	let t5;
    	let div3;
    	let t7;
    	let div4;
    	let t9;
    	let div5;
    	let t11;
    	let hr1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			t0 = space();
    			hr0 = element("hr");
    			t1 = space();
    			div6 = element("div");
    			div1 = element("div");
    			div1.textContent = "Normal";
    			t3 = space();
    			div2 = element("div");
    			div2.textContent = "Free Style";
    			t5 = space();
    			div3 = element("div");
    			div3.textContent = "Reaction";
    			t7 = space();
    			div4 = element("div");
    			div4.textContent = "Calibrate";
    			t9 = space();
    			div5 = element("div");
    			div5.textContent = "Options";
    			t11 = space();
    			hr1 = element("hr");
    			attr_dev(div0, "class", "logo svelte-1ssh224");
    			add_location(div0, file, 100, 2, 2078);
    			attr_dev(hr0, "class", "svelte-1ssh224");
    			add_location(hr0, file, 101, 2, 2102);
    			attr_dev(div1, "class", "item svelte-1ssh224");
    			add_location(div1, file, 103, 4, 2137);
    			attr_dev(div2, "class", "item svelte-1ssh224");
    			add_location(div2, file, 104, 4, 2204);
    			attr_dev(div3, "class", "item svelte-1ssh224");
    			add_location(div3, file, 105, 4, 2280);
    			attr_dev(div4, "class", "item svelte-1ssh224");
    			add_location(div4, file, 106, 4, 2353);
    			attr_dev(div5, "class", "item svelte-1ssh224");
    			add_location(div5, file, 107, 4, 2428);
    			attr_dev(div6, "class", "items svelte-1ssh224");
    			add_location(div6, file, 102, 2, 2112);
    			attr_dev(hr1, "class", "svelte-1ssh224");
    			add_location(hr1, file, 109, 2, 2507);
    			attr_dev(div7, "id", "menu");
    			attr_dev(div7, "class", "menu svelte-1ssh224");
    			add_location(div7, file, 99, 0, 2046);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div7, t0);
    			append_dev(div7, hr0);
    			append_dev(div7, t1);
    			append_dev(div7, div6);
    			append_dev(div6, div1);
    			append_dev(div6, t3);
    			append_dev(div6, div2);
    			append_dev(div6, t5);
    			append_dev(div6, div3);
    			append_dev(div6, t7);
    			append_dev(div6, div4);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div7, t11);
    			append_dev(div7, hr1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(div2, "click", /*click_handler_1*/ ctx[1], false, false, false),
    					listen_dev(div3, "click", /*click_handler_2*/ ctx[2], false, false, false),
    					listen_dev(div4, "click", /*click_handler_3*/ ctx[3], false, false, false),
    					listen_dev(div5, "click", /*click_handler_4*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Menu", $$slots, []);
    	const click_handler = () => push("/game");
    	const click_handler_1 = () => push("/freestyle");
    	const click_handler_2 = () => push("/reaction");
    	const click_handler_3 = () => push("/calibrate");
    	const click_handler_4 = () => push("/options");
    	$$self.$capture_state = () => ({ push, pop, replace });

    	return [
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\Timer.svelte generated by Svelte v3.23.2 */
    const file$1 = "src\\Timer.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let svg;
    	let circle_1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*time*/ ctx[1]);
    			t1 = space();
    			svg = svg_element("svg");
    			circle_1 = svg_element("circle");
    			attr_dev(div0, "class", "timerSeconds svelte-1lcktqu");
    			add_location(div0, file$1, 99, 2, 1864);
    			attr_dev(circle_1, "class", "timerCircle svelte-1lcktqu");
    			attr_dev(circle_1, "cx", "55");
    			attr_dev(circle_1, "cy", "55");
    			attr_dev(circle_1, "r", "50");
    			attr_dev(circle_1, "pathLength", "100");
    			add_location(circle_1, file$1, 101, 4, 1942);
    			attr_dev(svg, "width", "110");
    			attr_dev(svg, "height", "110");
    			add_location(svg, file$1, 100, 2, 1906);
    			attr_dev(div1, "class", "timer svelte-1lcktqu");
    			toggle_class(div1, "freestyle", /*gameType*/ ctx[0] == "freestyle");
    			toggle_class(div1, "reaction", /*gameType*/ ctx[0] == "reaction");
    			add_location(div1, file$1, 95, 0, 1750);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, svg);
    			append_dev(svg, circle_1);
    			/*circle_1_binding*/ ctx[4](circle_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*time*/ 2) set_data_dev(t0, /*time*/ ctx[1]);

    			if (dirty & /*gameType*/ 1) {
    				toggle_class(div1, "freestyle", /*gameType*/ ctx[0] == "freestyle");
    			}

    			if (dirty & /*gameType*/ 1) {
    				toggle_class(div1, "reaction", /*gameType*/ ctx[0] == "reaction");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*circle_1_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { gameType = "normal" } = $$props;
    	const dispatch = createEventDispatcher();
    	let time = 0;
    	let timerInterval;
    	let circle;

    	onMount(() => {
    		dispatch("loaded");
    	});

    	function setTime(seconds) {
    		if (timerInterval) clearInterval(timerInterval);
    		$$invalidate(1, time = seconds);
    		$$invalidate(2, circle.style.transition = "", circle);
    		$$invalidate(2, circle.style.strokeDashoffset = 0, circle);

    		setTimeout(
    			() => {
    				if (!circle) return;
    				$$invalidate(2, circle.style.transition = "stroke-dashoffset " + seconds + "s linear, stroke " + seconds + "s linear", circle);
    				$$invalidate(2, circle.style.strokeDashoffset = -99, circle);
    			},
    			100
    		);

    		timerInterval = setTimeout(timeTick, 1000);
    	}

    	function timeTick() {
    		$$invalidate(1, time--, time);

    		if (time == 0) {
    			dispatch("end");
    		} else {
    			timerInterval = setTimeout(timeTick, 1000);
    		}
    	}

    	const writable_props = ["gameType"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Timer", $$slots, []);

    	function circle_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			circle = $$value;
    			$$invalidate(2, circle);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("gameType" in $$props) $$invalidate(0, gameType = $$props.gameType);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		tick,
    		gameType,
    		dispatch,
    		time,
    		timerInterval,
    		circle,
    		setTime,
    		timeTick
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameType" in $$props) $$invalidate(0, gameType = $$props.gameType);
    		if ("time" in $$props) $$invalidate(1, time = $$props.time);
    		if ("timerInterval" in $$props) timerInterval = $$props.timerInterval;
    		if ("circle" in $$props) $$invalidate(2, circle = $$props.circle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [gameType, time, circle, setTime, circle_1_binding];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { gameType: 0, setTime: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get gameType() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameType(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get setTime() {
    		return this.$$.ctx[3];
    	}

    	set setTime(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const hitTarget = writable(localStorage.getItem("hitTarget") || 15);

    // export const topScoreNormal = writable(localStorage.getItem("topScoreNormal") || 0);
    // export const topScoreFreestle = writable(localStorage.getItem("topScoreFreestle") || 0);
    // export const topScoreReaction = writable(localStorage.getItem("topScoreReaction") || 0);

    hitTarget.subscribe(value => {
        localStorage.setItem("hitTarget", value);
    });

    // topScoreNormal.subscribe(value => {
    //     localStorage.setItem("topScoreNormal", value);
    // })

    // topScoreFreestle.subscribe(value => {
    //     localStorage.setItem("topScoreFreestle", value);
    // })

    // hitTarget.subscribe(value => {
    //     localStorage.setItem("topScoreReaction", value);
    // })

    /* src\Score.svelte generated by Svelte v3.23.2 */
    const file$2 = "src\\Score.svelte";

    function create_fragment$3(ctx) {
    	let div0;
    	let t0_value = /*combo*/ ctx[0] - 1 + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let t3_value = Math.round(/*currentScore*/ ctx[1]) + "";
    	let t3;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text("X");
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			attr_dev(div0, "class", "combo svelte-oip6t6");
    			add_location(div0, file$2, 73, 0, 1428);
    			attr_dev(div1, "class", "score svelte-oip6t6");
    			add_location(div1, file$2, 74, 0, 1488);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			/*div0_binding*/ ctx[5](div0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*combo*/ 1 && t0_value !== (t0_value = /*combo*/ ctx[0] - 1 + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*currentScore*/ 2 && t3_value !== (t3_value = Math.round(/*currentScore*/ ctx[1]) + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[5](null);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { score } = $$props;
    	let { combo } = $$props;
    	let currentScore = 0;
    	let active = false;
    	let comboDiv;

    	onMount(() => {
    		active = true;
    		requestAnimationFrame(render);
    	});

    	onDestroy(() => {
    		active = false;
    	});

    	function reset() {
    		$$invalidate(3, score = 0);
    		$$invalidate(1, currentScore = 0);
    	}

    	function render() {
    		if (!active) return;

    		if (Math.abs(currentScore - score) > 0.1) {
    			$$invalidate(1, currentScore += (score - currentScore) / 15);
    		}

    		requestAnimationFrame(render);
    	}

    	const writable_props = ["score", "combo"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Score> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Score", $$slots, []);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			comboDiv = $$value;
    			($$invalidate(2, comboDiv), $$invalidate(0, combo));
    		});
    	}

    	$$self.$set = $$props => {
    		if ("score" in $$props) $$invalidate(3, score = $$props.score);
    		if ("combo" in $$props) $$invalidate(0, combo = $$props.combo);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		score,
    		combo,
    		currentScore,
    		active,
    		comboDiv,
    		reset,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ("score" in $$props) $$invalidate(3, score = $$props.score);
    		if ("combo" in $$props) $$invalidate(0, combo = $$props.combo);
    		if ("currentScore" in $$props) $$invalidate(1, currentScore = $$props.currentScore);
    		if ("active" in $$props) active = $$props.active;
    		if ("comboDiv" in $$props) $$invalidate(2, comboDiv = $$props.comboDiv);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*comboDiv, combo*/ 5) {
    			 {
    				if (comboDiv) {
    					if (combo > 2) {
    						$$invalidate(2, comboDiv.style.opacity = 1, comboDiv);
    						$$invalidate(2, comboDiv.style.transform = `translate(-50%, -50%) scale(${1 + combo / 10})`, comboDiv);
    					}

    					if (combo == 0) {
    						$$invalidate(2, comboDiv.style.opacity = 0, comboDiv);
    						$$invalidate(2, comboDiv.style.transform = `translate(-50%, -50%) scale(1)`, comboDiv);
    					}
    				}
    			}
    		}
    	};

    	return [combo, currentScore, comboDiv, score, reset, div0_binding];
    }

    class Score extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { score: 3, combo: 0, reset: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Score",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*score*/ ctx[3] === undefined && !("score" in props)) {
    			console.warn("<Score> was created without expected prop 'score'");
    		}

    		if (/*combo*/ ctx[0] === undefined && !("combo" in props)) {
    			console.warn("<Score> was created without expected prop 'combo'");
    		}
    	}

    	get score() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get combo() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set combo(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get reset() {
    		return this.$$.ctx[4];
    	}

    	set reset(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\GameOver.svelte generated by Svelte v3.23.2 */
    const file$3 = "src\\GameOver.svelte";

    function create_fragment$4(ctx) {
    	let div6;
    	let h1;
    	let t1;
    	let div4;
    	let div1;
    	let h20;
    	let t3;
    	let div0;
    	let t4_value = Math.round(/*score*/ ctx[0]) + "";
    	let t4;
    	let t5;
    	let div3;
    	let h21;
    	let t7;
    	let div2;
    	let t8_value = Math.round(/*topScore*/ ctx[1]) + "";
    	let t8;
    	let t9;
    	let div5;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Game Over";
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Score:";
    			t3 = space();
    			div0 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Top Score:";
    			t7 = space();
    			div2 = element("div");
    			t8 = text(t8_value);
    			t9 = space();
    			div5 = element("div");
    			button = element("button");
    			button.textContent = "Restart";
    			attr_dev(h1, "class", "svelte-1w2yvfw");
    			add_location(h1, file$3, 157, 2, 2831);
    			attr_dev(h20, "class", "svelte-1w2yvfw");
    			add_location(h20, file$3, 160, 6, 2906);
    			attr_dev(div0, "class", "svelte-1w2yvfw");
    			add_location(div0, file$3, 161, 6, 2929);
    			attr_dev(div1, "class", "score svelte-1w2yvfw");
    			add_location(div1, file$3, 159, 4, 2879);
    			attr_dev(h21, "class", "svelte-1w2yvfw");
    			add_location(h21, file$3, 164, 6, 3004);
    			attr_dev(div2, "class", "svelte-1w2yvfw");
    			add_location(div2, file$3, 165, 6, 3031);
    			attr_dev(div3, "class", "score svelte-1w2yvfw");
    			add_location(div3, file$3, 163, 4, 2977);
    			attr_dev(div4, "class", "scores svelte-1w2yvfw");
    			add_location(div4, file$3, 158, 2, 2853);
    			attr_dev(button, "class", "restart svelte-1w2yvfw");
    			add_location(button, file$3, 169, 4, 3116);
    			attr_dev(div5, "class", "bottom svelte-1w2yvfw");
    			add_location(div5, file$3, 168, 2, 3090);
    			attr_dev(div6, "class", "bg svelte-1w2yvfw");
    			add_location(div6, file$3, 156, 0, 2811);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, h1);
    			append_dev(div6, t1);
    			append_dev(div6, div4);
    			append_dev(div4, div1);
    			append_dev(div1, h20);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, t4);
    			append_dev(div4, t5);
    			append_dev(div4, div3);
    			append_dev(div3, h21);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, t8);
    			append_dev(div6, t9);
    			append_dev(div6, div5);
    			append_dev(div5, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*restart*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*score*/ 1 && t4_value !== (t4_value = Math.round(/*score*/ ctx[0]) + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*topScore*/ 2 && t8_value !== (t8_value = Math.round(/*topScore*/ ctx[1]) + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { score } = $$props;
    	let { gameType } = $$props;
    	let topScore;

    	function getTopScore() {
    		switch (gameType) {
    			case "normal":
    				$$invalidate(1, topScore = +localStorage.getItem("topScoreNormal") || 0);
    				break;
    			case "freestyle":
    				$$invalidate(1, topScore = +localStorage.getItem("topScoreFreestyle") || 0);
    				break;
    			case "reaction":
    				$$invalidate(1, topScore = +localStorage.getItem("topScoreReaction") || 0);
    				break;
    		}
    	}

    	function setTopScore() {
    		switch (gameType) {
    			case "normal":
    				localStorage.setItem("topScoreNormal", topScore);
    				break;
    			case "freestyle":
    				localStorage.setItem("topScoreFreestyle", topScore);
    				break;
    			case "reaction":
    				localStorage.setItem("topScoreReaction", topScore);
    				break;
    		}
    	}

    	onMount(() => {
    		getTopScore();
    	});

    	function restart() {
    		dispatch("restart");
    	}

    	const writable_props = ["score", "gameType"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameOver> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GameOver", $$slots, []);

    	$$self.$set = $$props => {
    		if ("score" in $$props) $$invalidate(0, score = $$props.score);
    		if ("gameType" in $$props) $$invalidate(3, gameType = $$props.gameType);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		dispatch,
    		score,
    		gameType,
    		topScore,
    		getTopScore,
    		setTopScore,
    		restart
    	});

    	$$self.$inject_state = $$props => {
    		if ("score" in $$props) $$invalidate(0, score = $$props.score);
    		if ("gameType" in $$props) $$invalidate(3, gameType = $$props.gameType);
    		if ("topScore" in $$props) $$invalidate(1, topScore = $$props.topScore);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*score, topScore*/ 3) {
    			 {
    				if (score > topScore) {
    					$$invalidate(1, topScore = score);
    					setTopScore();
    				}
    			}
    		}
    	};

    	return [score, topScore, restart, gameType];
    }

    class GameOver extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { score: 0, gameType: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameOver",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*score*/ ctx[0] === undefined && !("score" in props)) {
    			console.warn("<GameOver> was created without expected prop 'score'");
    		}

    		if (/*gameType*/ ctx[3] === undefined && !("gameType" in props)) {
    			console.warn("<GameOver> was created without expected prop 'gameType'");
    		}
    	}

    	get score() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set score(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gameType() {
    		throw new Error("<GameOver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameType(value) {
    		throw new Error("<GameOver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Effects.svelte generated by Svelte v3.23.2 */
    const file$4 = "src\\Effects.svelte";

    function create_fragment$5(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "effects svelte-1my46pf");
    			add_location(canvas_1, file$4, 135, 0, 2782);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[3](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[3](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let active = false;
    	let particles = [];
    	let canvas, ctx;
    	let width = window.innerWidth;
    	let height = window.innerHeight;
    	let PARTICLE_MAX_AGE = 20;
    	let flashAmount = 0;
    	let flashColor = "255,255,255";

    	onMount(() => {
    		active = true;
    		ctx = canvas.getContext("2d");
    		$$invalidate(0, canvas.width = width, canvas);
    		$$invalidate(0, canvas.height = height, canvas);
    		initParticles();
    		requestAnimationFrame(render);
    	});

    	onDestroy(() => {
    		active = false;
    	});

    	function clear() {
    		if (!canvas) return;
    		ctx.clearRect(0, 0, canvas.width, canvas.height);
    	}

    	function spawnParticles(amount, vx, vy) {
    		for (let i = 0; i < amount; i++) {
    			let p = particles.find(p => !p.active);
    			if (!p) return;
    			p.x = width / 2 + vx * Math.random() * 50;
    			p.y = height / 2 + vy * Math.random() * 50;
    			p.vx = vx + Math.random() * 10 - 5;
    			p.vy = vy + Math.random() * 10 - 5;
    			p.active = true;
    			p.age = 0;
    		}
    	}

    	function moveParticles() {
    		particles.forEach(p => {
    			if (p.active) {
    				p.x += p.vx;
    				p.y += p.vy;
    				p.vx *= 0.96;
    				p.vy = p.vy * 0.96 + 1;
    				p.age += 1;

    				if (p.age > PARTICLE_MAX_AGE) {
    					p.active = false;
    				}
    			}
    		});
    	}

    	function initParticles() {
    		for (let i = 0; i < 200; i++) {
    			let p = {
    				x: 0,
    				y: 0,
    				vx: 0,
    				vy: 0,
    				age: 0,
    				active: false
    			};

    			particles.push(p);
    		}
    	}

    	function drawParticles() {
    		ctx.globalCompositeOperation = "overlay";

    		particles.forEach(p => {
    			if (p.active) {
    				ctx.beginPath();
    				let life = p.age / PARTICLE_MAX_AGE;
    				ctx.fillStyle = `rgb(255, 255, 255)`;
    				ctx.arc(p.x, p.y, 3 - life * 3, 0, Math.PI * 2);
    				ctx.fill();
    			}
    		});
    	}

    	function drawFlash() {
    		if (flashAmount > 0) {
    			flashAmount *= 0.93;

    			if (flashAmount < 0.01) {
    				flashAmount = 0;
    			}
    		}

    		ctx.fillStyle = `rgba(${flashColor},${flashAmount})`;
    		ctx.fillRect(0, 0, width, height);
    	}

    	function flash(amount, color) {
    		flashColor = color;
    		flashAmount += amount;
    	}

    	function test() {
    		let vx = Math.random() * 30 - 15;
    		let vy = Math.random() * 30 - 15;
    		flash(0.2);
    		spawnParticles(5, vx, vy);
    	}

    	function render() {
    		moveParticles();
    		clear();
    		drawFlash();
    		drawParticles();
    		if (active) requestAnimationFrame(render);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Effects> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Effects", $$slots, []);

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		active,
    		particles,
    		canvas,
    		ctx,
    		width,
    		height,
    		PARTICLE_MAX_AGE,
    		flashAmount,
    		flashColor,
    		clear,
    		spawnParticles,
    		moveParticles,
    		initParticles,
    		drawParticles,
    		drawFlash,
    		flash,
    		test,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) active = $$props.active;
    		if ("particles" in $$props) particles = $$props.particles;
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("width" in $$props) width = $$props.width;
    		if ("height" in $$props) height = $$props.height;
    		if ("PARTICLE_MAX_AGE" in $$props) PARTICLE_MAX_AGE = $$props.PARTICLE_MAX_AGE;
    		if ("flashAmount" in $$props) flashAmount = $$props.flashAmount;
    		if ("flashColor" in $$props) flashColor = $$props.flashColor;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, spawnParticles, flash, canvas_1_binding];
    }

    class Effects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { spawnParticles: 1, flash: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Effects",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get spawnParticles() {
    		return this.$$.ctx[1];
    	}

    	set spawnParticles(value) {
    		throw new Error("<Effects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flash() {
    		return this.$$.ctx[2];
    	}

    	set flash(value) {
    		throw new Error("<Effects>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\NormalGame.svelte generated by Svelte v3.23.2 */
    const file$5 = "src\\NormalGame.svelte";

    // (324:2) {#if state == STATE.GameOver}
    function create_if_block$1(ctx) {
    	let gameover;
    	let updating_gameType;
    	let current;

    	function gameover_gameType_binding(value) {
    		/*gameover_gameType_binding*/ ctx[21].call(null, value);
    	}

    	let gameover_props = { score: /*score*/ ctx[5] };

    	if (/*gameType*/ ctx[0] !== void 0) {
    		gameover_props.gameType = /*gameType*/ ctx[0];
    	}

    	gameover = new GameOver({ props: gameover_props, $$inline: true });
    	binding_callbacks.push(() => bind(gameover, "gameType", gameover_gameType_binding));
    	gameover.$on("restart", /*newGame*/ ctx[12]);

    	const block = {
    		c: function create() {
    			create_component(gameover.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gameover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gameover_changes = {};
    			if (dirty[0] & /*score*/ 32) gameover_changes.score = /*score*/ ctx[5];

    			if (!updating_gameType && dirty[0] & /*gameType*/ 1) {
    				updating_gameType = true;
    				gameover_changes.gameType = /*gameType*/ ctx[0];
    				add_flush_callback(() => updating_gameType = false);
    			}

    			gameover.$set(gameover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gameover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(324:2) {#if state == STATE.GameOver}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div11;
    	let effects_1;
    	let t0;
    	let div3;
    	let div0;
    	let t1;
    	let t2_value = (/*level*/ ctx[10] == 0 ? 1 : /*level*/ ctx[10]) + "";
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let t5;
    	let div2;
    	let t6;
    	let score_1;
    	let t7;
    	let div4;
    	let timer_1;
    	let t8;
    	let div9;
    	let div8;
    	let div7;
    	let div5;
    	let t9;
    	let div6;
    	let t10;
    	let div10;
    	let t12;
    	let current;
    	let mounted;
    	let dispose;
    	let effects_1_props = {};
    	effects_1 = new Effects({ props: effects_1_props, $$inline: true });
    	/*effects_1_binding*/ ctx[15](effects_1);

    	let score_1_props = {
    		score: /*score*/ ctx[5],
    		combo: /*combo*/ ctx[8]
    	};

    	score_1 = new Score({ props: score_1_props, $$inline: true });
    	/*score_1_binding*/ ctx[16](score_1);
    	let timer_1_props = {};
    	timer_1 = new Timer({ props: timer_1_props, $$inline: true });
    	/*timer_1_binding*/ ctx[17](timer_1);
    	timer_1.$on("end", /*timerEnd*/ ctx[13]);
    	let if_block = /*state*/ ctx[1] == /*STATE*/ ctx[11].GameOver && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			create_component(effects_1.$$.fragment);
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t1 = text("Level ");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			t4 = text(/*msg*/ ctx[4]);
    			t5 = space();
    			div2 = element("div");
    			t6 = text("Score:\r\n      ");
    			create_component(score_1.$$.fragment);
    			t7 = space();
    			div4 = element("div");
    			create_component(timer_1.$$.fragment);
    			t8 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			t9 = space();
    			div6 = element("div");
    			t10 = space();
    			div10 = element("div");
    			div10.textContent = "X";
    			t12 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "level svelte-6eyebz");
    			add_location(div0, file$5, 304, 4, 5895);
    			attr_dev(div1, "class", "msg svelte-6eyebz");
    			add_location(div1, file$5, 305, 4, 5956);
    			attr_dev(div2, "class", "score svelte-6eyebz");
    			add_location(div2, file$5, 306, 4, 5990);
    			attr_dev(div3, "class", "texts svelte-6eyebz");
    			add_location(div3, file$5, 303, 2, 5870);
    			attr_dev(div4, "class", "middle svelte-6eyebz");
    			add_location(div4, file$5, 311, 2, 6104);
    			attr_dev(div5, "class", "hpColor svelte-6eyebz");
    			add_location(div5, file$5, 317, 8, 6292);
    			attr_dev(div6, "class", "barHighlight svelte-6eyebz");
    			add_location(div6, file$5, 318, 8, 6345);
    			attr_dev(div7, "class", "hp svelte-6eyebz");
    			add_location(div7, file$5, 316, 6, 6248);
    			attr_dev(div8, "class", "hpContainer svelte-6eyebz");
    			add_location(div8, file$5, 315, 4, 6215);
    			attr_dev(div9, "class", "bottom svelte-6eyebz");
    			add_location(div9, file$5, 314, 2, 6189);
    			attr_dev(div10, "class", "backBtn svelte-6eyebz");
    			add_location(div10, file$5, 322, 2, 6413);
    			attr_dev(div11, "class", "game svelte-6eyebz");
    			add_location(div11, file$5, 301, 0, 5794);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			mount_component(effects_1, div11, null);
    			append_dev(div11, t0);
    			append_dev(div11, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, t6);
    			mount_component(score_1, div2, null);
    			append_dev(div11, t7);
    			append_dev(div11, div4);
    			mount_component(timer_1, div4, null);
    			append_dev(div11, t8);
    			append_dev(div11, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			/*div5_binding*/ ctx[18](div5);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			/*div7_binding*/ ctx[19](div7);
    			append_dev(div11, t10);
    			append_dev(div11, div10);
    			append_dev(div11, t12);
    			if (if_block) if_block.m(div11, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div10, "click", /*click_handler*/ ctx[20], false, false, false),
    					listen_dev(div11, "click", /*testHit*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const effects_1_changes = {};
    			effects_1.$set(effects_1_changes);
    			if ((!current || dirty[0] & /*level*/ 1024) && t2_value !== (t2_value = (/*level*/ ctx[10] == 0 ? 1 : /*level*/ ctx[10]) + "")) set_data_dev(t2, t2_value);
    			if (!current || dirty[0] & /*msg*/ 16) set_data_dev(t4, /*msg*/ ctx[4]);
    			const score_1_changes = {};
    			if (dirty[0] & /*score*/ 32) score_1_changes.score = /*score*/ ctx[5];
    			if (dirty[0] & /*combo*/ 256) score_1_changes.combo = /*combo*/ ctx[8];
    			score_1.$set(score_1_changes);
    			const timer_1_changes = {};
    			timer_1.$set(timer_1_changes);

    			if (/*state*/ ctx[1] == /*STATE*/ ctx[11].GameOver) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*state*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div11, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(effects_1.$$.fragment, local);
    			transition_in(score_1.$$.fragment, local);
    			transition_in(timer_1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(effects_1.$$.fragment, local);
    			transition_out(score_1.$$.fragment, local);
    			transition_out(timer_1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			/*effects_1_binding*/ ctx[15](null);
    			destroy_component(effects_1);
    			/*score_1_binding*/ ctx[16](null);
    			destroy_component(score_1);
    			/*timer_1_binding*/ ctx[17](null);
    			destroy_component(timer_1);
    			/*div5_binding*/ ctx[18](null);
    			/*div7_binding*/ ctx[19](null);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $hitTarget;
    	validate_store(hitTarget, "hitTarget");
    	component_subscribe($$self, hitTarget, $$value => $$invalidate(27, $hitTarget = $$value));
    	const STATE = { GetReady: 0, Playing: 1, GameOver: 2 };
    	let gameType = "normal";
    	let state = STATE.GameOver;
    	let hpBar;
    	let hpColor;
    	let msg;
    	let score;
    	let scoreComp;
    	let timer;
    	let onTimerEnd;
    	let timerHidden = false;
    	let combo = 0;
    	let comboTimout;
    	let effects;
    	let level;
    	let hp;
    	let maxHp;
    	let minHit = 2;
    	let hitWait = 0;

    	function newGame() {
    		$$invalidate(5, score = 0);
    		$$invalidate(8, combo = 0);
    		hp = 45;
    		maxHp = 45;
    		$$invalidate(10, level = 0);
    		$$invalidate(2, hpBar.style.width = "100%", hpBar);
    		$$invalidate(3, hpColor.style.backgroundColor = "#62ff00", hpColor);
    		window.addEventListener("devicemotion", hit, true);
    		getReady();
    		scoreComp.reset();
    	}

    	function getReady() {
    		$$invalidate(1, state = STATE.GetReady);
    		$$invalidate(4, msg = "Get Ready!!");
    		$$invalidate(2, hpBar.style.width = "100%", hpBar);
    		$$invalidate(3, hpColor.style.backgroundColor = "#62ff00", hpColor);
    		onTimerEnd = nextLevel;
    		$$invalidate(10, level++, level);
    		timer.setTime(2);
    	}

    	function nextLevel() {
    		if (state == STATE.GameOver) return;
    		$$invalidate(1, state = STATE.Playing);
    		maxHp = 45 + level * 5;
    		hp = maxHp;
    		$$invalidate(4, msg = "GO!!!");
    		onTimerEnd = gameOver;
    		timer.setTime(10 + (level - 1) * 3);
    	}

    	function gameOver() {
    		$$invalidate(1, state = STATE.GameOver);
    		window.removeEventListener("devicemotion", hit, true);
    	}

    	function timerEnd() {
    		onTimerEnd();
    	}

    	function hit(event) {
    		if (hitWait > 0) {
    			hitWait--;
    			return;
    		}

    		let x = event.acceleration.x;
    		let y = event.acceleration.y;
    		let z = event.acceleration.z;
    		let hit = Math.sqrt(x * x + y * y + z * z); //movement vector length

    		if (state == STATE.Playing) {
    			hitWait = 15;
    			if (hit < minHit) return;
    			hit /= $hitTarget; //calibrate
    			hp -= hit;
    			let scoreToAdd = hit * 100;

    			//combo
    			if (comboTimout) {
    				clearInterval(comboTimout);
    			}

    			comboTimout = setTimeout(
    				() => {
    					$$invalidate(8, combo = 0);
    				},
    				400
    			);

    			$$invalidate(8, combo++, combo);
    			if (combo > 2) scoreToAdd *= combo - 1;
    			$$invalidate(5, score += scoreToAdd);
    			if (hp < 0) hp = 0;
    			let hpNormalized = hp / maxHp;
    			$$invalidate(2, hpBar.style.width = hpNormalized * 100 + "%", hpBar);
    			$$invalidate(3, hpColor.style.backgroundColor = `hsl(${Math.floor(hpNormalized * 120)},100%,60%)`, hpColor);
    			effects.spawnParticles(combo > 2 ? 6 : 2, x, y);

    			if (combo > 2) {
    				let redLevel = 255 - combo / 8 * 128;
    				let c = `255,${redLevel},${redLevel}`;
    				effects.flash(0.2, c);
    			} else {
    				effects.flash(0.2, "255,255,255");
    			}

    			if (hp == 0) {
    				getReady();
    			}
    		}
    	}

    	onMount(() => {
    		newGame();
    	});

    	onDestroy(() => {
    		gameOver();
    	});

    	function testHit() {
    		let event = {
    			acceleration: {
    				x: Math.random() * 10 - 5,
    				y: Math.random() * 10 - 5,
    				z: Math.random() * 10 - 5
    			}
    		};

    		hit(event);
    		hitWait = 0;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<NormalGame> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("NormalGame", $$slots, []);

    	function effects_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			effects = $$value;
    			$$invalidate(9, effects);
    		});
    	}

    	function score_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scoreComp = $$value;
    			$$invalidate(6, scoreComp);
    		});
    	}

    	function timer_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			timer = $$value;
    			$$invalidate(7, timer);
    		});
    	}

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			hpColor = $$value;
    			$$invalidate(3, hpColor);
    		});
    	}

    	function div7_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			hpBar = $$value;
    			$$invalidate(2, hpBar);
    		});
    	}

    	const click_handler = () => pop();

    	function gameover_gameType_binding(value) {
    		gameType = value;
    		$$invalidate(0, gameType);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		pop,
    		Timer,
    		hitTarget,
    		Score,
    		GameOver,
    		Effects,
    		STATE,
    		gameType,
    		state,
    		hpBar,
    		hpColor,
    		msg,
    		score,
    		scoreComp,
    		timer,
    		onTimerEnd,
    		timerHidden,
    		combo,
    		comboTimout,
    		effects,
    		level,
    		hp,
    		maxHp,
    		minHit,
    		hitWait,
    		newGame,
    		getReady,
    		nextLevel,
    		gameOver,
    		timerEnd,
    		hit,
    		testHit,
    		$hitTarget
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameType" in $$props) $$invalidate(0, gameType = $$props.gameType);
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    		if ("hpBar" in $$props) $$invalidate(2, hpBar = $$props.hpBar);
    		if ("hpColor" in $$props) $$invalidate(3, hpColor = $$props.hpColor);
    		if ("msg" in $$props) $$invalidate(4, msg = $$props.msg);
    		if ("score" in $$props) $$invalidate(5, score = $$props.score);
    		if ("scoreComp" in $$props) $$invalidate(6, scoreComp = $$props.scoreComp);
    		if ("timer" in $$props) $$invalidate(7, timer = $$props.timer);
    		if ("onTimerEnd" in $$props) onTimerEnd = $$props.onTimerEnd;
    		if ("timerHidden" in $$props) timerHidden = $$props.timerHidden;
    		if ("combo" in $$props) $$invalidate(8, combo = $$props.combo);
    		if ("comboTimout" in $$props) comboTimout = $$props.comboTimout;
    		if ("effects" in $$props) $$invalidate(9, effects = $$props.effects);
    		if ("level" in $$props) $$invalidate(10, level = $$props.level);
    		if ("hp" in $$props) hp = $$props.hp;
    		if ("maxHp" in $$props) maxHp = $$props.maxHp;
    		if ("minHit" in $$props) minHit = $$props.minHit;
    		if ("hitWait" in $$props) hitWait = $$props.hitWait;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gameType,
    		state,
    		hpBar,
    		hpColor,
    		msg,
    		score,
    		scoreComp,
    		timer,
    		combo,
    		effects,
    		level,
    		STATE,
    		newGame,
    		timerEnd,
    		testHit,
    		effects_1_binding,
    		score_1_binding,
    		timer_1_binding,
    		div5_binding,
    		div7_binding,
    		click_handler,
    		gameover_gameType_binding
    	];
    }

    class NormalGame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NormalGame",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Calibrate.svelte generated by Svelte v3.23.2 */
    const file$6 = "src\\Calibrate.svelte";

    function create_fragment$7(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let t0;
    	let img;
    	let img_src_value;
    	let t1;
    	let div2;
    	let t2;
    	let input;
    	let t3;
    	let t4;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			img = element("img");
    			t1 = space();
    			div2 = element("div");
    			t2 = text("-\r\n    ");
    			input = element("input");
    			t3 = text("\r\n    +");
    			t4 = space();
    			div3 = element("div");
    			div3.textContent = "X";
    			attr_dev(div0, "class", "hitCircle svelte-1d03c5t");
    			add_location(div0, file$6, 163, 4, 3113);
    			if (img.src !== (img_src_value = "images/glove.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Hit Me!");
    			attr_dev(img, "class", "svelte-1d03c5t");
    			add_location(img, file$6, 164, 4, 3166);
    			attr_dev(div1, "class", "hit svelte-1d03c5t");
    			add_location(div1, file$6, 162, 2, 3090);
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "1");
    			attr_dev(input, "max", "30");
    			attr_dev(input, "step", "1");
    			attr_dev(input, "class", "svelte-1d03c5t");
    			add_location(input, file$6, 168, 4, 3277);
    			attr_dev(div2, "class", "slider svelte-1d03c5t");
    			add_location(div2, file$6, 166, 2, 3244);
    			attr_dev(div3, "class", "backBtn svelte-1d03c5t");
    			add_location(div3, file$6, 177, 2, 3432);
    			attr_dev(div4, "class", "calibrate svelte-1d03c5t");
    			add_location(div4, file$6, 161, 0, 3044);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			/*div0_binding*/ ctx[5](div0);
    			append_dev(div1, t0);
    			append_dev(div1, img);
    			/*img_binding*/ ctx[6](img);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, t2);
    			append_dev(div2, input);
    			/*input_binding*/ ctx[7](input);
    			append_dev(div2, t3);
    			append_dev(div4, t4);
    			append_dev(div4, div3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*setHitTarget*/ ctx[3], false, false, false),
    					listen_dev(div3, "click", /*click_handler*/ ctx[8], false, false, false),
    					listen_dev(div4, "click", /*testHit*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*div0_binding*/ ctx[5](null);
    			/*img_binding*/ ctx[6](null);
    			/*input_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $hitTarget;
    	validate_store(hitTarget, "hitTarget");
    	component_subscribe($$self, hitTarget, $$value => $$invalidate(13, $hitTarget = $$value));
    	let slider;
    	let hitLevel;
    	let hitWait = 0;
    	let greenWait = 0;
    	let active;
    	let hitCircle;
    	let hitRing;

    	onMount(async () => {
    		window.addEventListener("devicemotion", hit, true);
    		active = true;
    		$$invalidate(0, slider.value = 31 - $hitTarget, slider);
    		render();
    	});

    	onDestroy(() => {
    		window.removeEventListener("devicemotion", hit, true);
    		active = false;
    	});

    	function setHitTarget(e) {
    		hitTarget.set(31 - e.target.value);
    	}

    	function testHit() {
    		let event = {
    			acceleration: {
    				x: 10 + (Math.random() * 10 - 5),
    				y: 0,
    				z: 0
    			}
    		};

    		hit(event);
    		hitWait = 0;

    		setTimeout(
    			() => {
    				greenWait = 0;
    			},
    			500
    		);
    	}

    	function hit(event) {
    		let x = event.acceleration.x;
    		let y = event.acceleration.y;
    		let z = event.acceleration.z;
    		let v = Math.sqrt(x * x + y * y + z * z); //movement vector length

    		if (v > 2) {
    			hitLevel = v;
    			hitWait = 10;
    			let n = v / $hitTarget; //normalize with hitTarget

    			if (n > 0.9 && n < 1.1) {
    				greenWait = 30;
    			}
    		}

    		greenWait--;
    	}

    	function render() {
    		if (!active) return;
    		let n = hitLevel / $hitTarget;

    		if (greenWait > 28) {
    			$$invalidate(1, hitCircle.style.transform = `scale(1)`, hitCircle);
    		} else if (n > 0.01) {
    			$$invalidate(1, hitCircle.style.transform = `scale(${n})`, hitCircle);
    		} else {
    			$$invalidate(1, hitCircle.style.transform = `scale(0)`, hitCircle);
    		}

    		if (greenWait > 0) {
    			$$invalidate(2, hitRing.style.border = "15px solid #1dff4f", hitRing);
    		} else {
    			$$invalidate(2, hitRing.style.border = "", hitRing);
    		}

    		hitLevel *= 0.875;

    		if (hitWait > 0) {
    			hitWait--;
    		}

    		requestAnimationFrame(render);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Calibrate> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Calibrate", $$slots, []);

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			hitCircle = $$value;
    			$$invalidate(1, hitCircle);
    		});
    	}

    	function img_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			hitRing = $$value;
    			$$invalidate(2, hitRing);
    		});
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			slider = $$value;
    			$$invalidate(0, slider);
    		});
    	}

    	const click_handler = () => {
    		pop();
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		pop,
    		hitTarget,
    		slider,
    		hitLevel,
    		hitWait,
    		greenWait,
    		active,
    		hitCircle,
    		hitRing,
    		setHitTarget,
    		testHit,
    		hit,
    		render,
    		$hitTarget
    	});

    	$$self.$inject_state = $$props => {
    		if ("slider" in $$props) $$invalidate(0, slider = $$props.slider);
    		if ("hitLevel" in $$props) hitLevel = $$props.hitLevel;
    		if ("hitWait" in $$props) hitWait = $$props.hitWait;
    		if ("greenWait" in $$props) greenWait = $$props.greenWait;
    		if ("active" in $$props) active = $$props.active;
    		if ("hitCircle" in $$props) $$invalidate(1, hitCircle = $$props.hitCircle);
    		if ("hitRing" in $$props) $$invalidate(2, hitRing = $$props.hitRing);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		slider,
    		hitCircle,
    		hitRing,
    		setHitTarget,
    		testHit,
    		div0_binding,
    		img_binding,
    		input_binding,
    		click_handler
    	];
    }

    class Calibrate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calibrate",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Freestle.svelte generated by Svelte v3.23.2 */
    const file$7 = "src\\Freestle.svelte";

    // (182:2) {#if state == STATE.GameOver}
    function create_if_block$2(ctx) {
    	let gameover;
    	let updating_gameType;
    	let current;

    	function gameover_gameType_binding(value) {
    		/*gameover_gameType_binding*/ ctx[16].call(null, value);
    	}

    	let gameover_props = { score: /*score*/ ctx[3] };

    	if (/*gameType*/ ctx[0] !== void 0) {
    		gameover_props.gameType = /*gameType*/ ctx[0];
    	}

    	gameover = new GameOver({ props: gameover_props, $$inline: true });
    	binding_callbacks.push(() => bind(gameover, "gameType", gameover_gameType_binding));
    	gameover.$on("restart", /*newGame*/ ctx[9]);

    	const block = {
    		c: function create() {
    			create_component(gameover.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gameover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gameover_changes = {};
    			if (dirty & /*score*/ 8) gameover_changes.score = /*score*/ ctx[3];

    			if (!updating_gameType && dirty & /*gameType*/ 1) {
    				updating_gameType = true;
    				gameover_changes.gameType = /*gameType*/ ctx[0];
    				add_flush_callback(() => updating_gameType = false);
    			}

    			gameover.$set(gameover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gameover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(182:2) {#if state == STATE.GameOver}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div3;
    	let effects_1;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let score_1;
    	let t4;
    	let timer_1;
    	let t5;
    	let div2;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;
    	let effects_1_props = {};
    	effects_1 = new Effects({ props: effects_1_props, $$inline: true });
    	/*effects_1_binding*/ ctx[12](effects_1);

    	let score_1_props = {
    		score: /*score*/ ctx[3],
    		combo: /*combo*/ ctx[6]
    	};

    	score_1 = new Score({ props: score_1_props, $$inline: true });
    	/*score_1_binding*/ ctx[13](score_1);
    	let timer_1_props = { gameType: /*gameType*/ ctx[0] };
    	timer_1 = new Timer({ props: timer_1_props, $$inline: true });
    	/*timer_1_binding*/ ctx[14](timer_1);
    	timer_1.$on("end", /*timerEnd*/ ctx[10]);
    	let if_block = /*state*/ ctx[1] == /*STATE*/ ctx[8].GameOver && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			create_component(effects_1.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = text(/*msg*/ ctx[2]);
    			t2 = space();
    			div1 = element("div");
    			t3 = text("Score:\r\n    ");
    			create_component(score_1.$$.fragment);
    			t4 = space();
    			create_component(timer_1.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "X";
    			t7 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "msg svelte-apdrzf");
    			add_location(div0, file$7, 174, 2, 3325);
    			attr_dev(div1, "class", "score svelte-apdrzf");
    			add_location(div1, file$7, 175, 2, 3357);
    			attr_dev(div2, "class", "backBtn svelte-apdrzf");
    			add_location(div2, file$7, 180, 2, 3515);
    			attr_dev(div3, "class", "game svelte-apdrzf");
    			add_location(div3, file$7, 172, 0, 3249);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			mount_component(effects_1, div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			mount_component(score_1, div1, null);
    			append_dev(div3, t4);
    			mount_component(timer_1, div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div3, t7);
    			if (if_block) if_block.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click_handler*/ ctx[15], false, false, false),
    					listen_dev(div3, "click", /*testHit*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const effects_1_changes = {};
    			effects_1.$set(effects_1_changes);
    			if (!current || dirty & /*msg*/ 4) set_data_dev(t1, /*msg*/ ctx[2]);
    			const score_1_changes = {};
    			if (dirty & /*score*/ 8) score_1_changes.score = /*score*/ ctx[3];
    			if (dirty & /*combo*/ 64) score_1_changes.combo = /*combo*/ ctx[6];
    			score_1.$set(score_1_changes);
    			const timer_1_changes = {};
    			if (dirty & /*gameType*/ 1) timer_1_changes.gameType = /*gameType*/ ctx[0];
    			timer_1.$set(timer_1_changes);

    			if (/*state*/ ctx[1] == /*STATE*/ ctx[8].GameOver) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*state*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(effects_1.$$.fragment, local);
    			transition_in(score_1.$$.fragment, local);
    			transition_in(timer_1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(effects_1.$$.fragment, local);
    			transition_out(score_1.$$.fragment, local);
    			transition_out(timer_1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*effects_1_binding*/ ctx[12](null);
    			destroy_component(effects_1);
    			/*score_1_binding*/ ctx[13](null);
    			destroy_component(score_1);
    			/*timer_1_binding*/ ctx[14](null);
    			destroy_component(timer_1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $hitTarget;
    	validate_store(hitTarget, "hitTarget");
    	component_subscribe($$self, hitTarget, $$value => $$invalidate(20, $hitTarget = $$value));
    	const STATE = { GetReady: 0, Playing: 1, GameOver: 2 };
    	let gameType = "freestyle";
    	let state = STATE.GameOver;
    	let msg;
    	let score;
    	let scoreComp;
    	let timer;
    	let onTimerEnd;
    	let combo = 0;
    	let comboTimout;
    	let effects;
    	let hp;
    	let maxHp;
    	let minHit = 2;
    	let hitWait = 0;

    	function newGame() {
    		$$invalidate(3, score = 0);
    		$$invalidate(6, combo = 0);
    		window.addEventListener("devicemotion", hit, true);
    		getReady();
    		scoreComp.reset();
    	}

    	function getReady() {
    		$$invalidate(1, state = STATE.GetReady);
    		$$invalidate(2, msg = "Get Ready!!");
    		onTimerEnd = start;
    		timer.setTime(1);
    	}

    	function start() {
    		$$invalidate(1, state = STATE.Playing);
    		$$invalidate(2, msg = "GO!!!");
    		onTimerEnd = gameOver;
    		timer.setTime(10);
    	}

    	function gameOver() {
    		$$invalidate(1, state = STATE.GameOver);
    		window.removeEventListener("devicemotion", hit, true);
    	}

    	function hit(event) {
    		if (hitWait > 0) {
    			hitWait--;
    			return;
    		}

    		let x = event.acceleration.x;
    		let y = event.acceleration.y;
    		let z = event.acceleration.z;
    		let hit = Math.sqrt(x * x + y * y + z * z); //movement vector length

    		if (state == STATE.Playing) {
    			hitWait = 15;
    			if (hit < minHit) return;
    			hit /= $hitTarget; //calibrate
    			let scoreToAdd = hit * 100;
    			if (combo > 2) scoreToAdd *= combo - 1;
    			$$invalidate(3, score += scoreToAdd);
    			effects.spawnParticles(combo > 2 ? 6 : 2, x, y);

    			//combo
    			if (comboTimout) {
    				clearInterval(comboTimout);
    			}

    			comboTimout = setTimeout(
    				() => {
    					$$invalidate(6, combo = 0);
    				},
    				400
    			);

    			$$invalidate(6, combo++, combo);

    			if (combo > 2) {
    				let redLevel = 255 - combo / 8 * 128;
    				let c = `255,${redLevel},${redLevel}`;
    				effects.flash(0.2, c);
    			} else {
    				effects.flash(0.2, "255,255,255");
    			}
    		}
    	}

    	function timerEnd() {
    		onTimerEnd();
    	}

    	onMount(() => {
    		newGame();
    	});

    	onDestroy(() => {
    		gameOver();
    	});

    	function testHit() {
    		let event = {
    			acceleration: {
    				x: Math.random() * 10 - 5,
    				y: Math.random() * 10 - 5,
    				z: Math.random() * 10 - 5
    			}
    		};

    		hit(event);
    		hitWait = 0;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Freestle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Freestle", $$slots, []);

    	function effects_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			effects = $$value;
    			$$invalidate(7, effects);
    		});
    	}

    	function score_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scoreComp = $$value;
    			$$invalidate(4, scoreComp);
    		});
    	}

    	function timer_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			timer = $$value;
    			$$invalidate(5, timer);
    		});
    	}

    	const click_handler = () => pop();

    	function gameover_gameType_binding(value) {
    		gameType = value;
    		$$invalidate(0, gameType);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		pop,
    		Timer,
    		hitTarget,
    		Score,
    		GameOver,
    		Effects,
    		STATE,
    		gameType,
    		state,
    		msg,
    		score,
    		scoreComp,
    		timer,
    		onTimerEnd,
    		combo,
    		comboTimout,
    		effects,
    		hp,
    		maxHp,
    		minHit,
    		hitWait,
    		newGame,
    		getReady,
    		start,
    		gameOver,
    		hit,
    		timerEnd,
    		testHit,
    		$hitTarget
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameType" in $$props) $$invalidate(0, gameType = $$props.gameType);
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    		if ("msg" in $$props) $$invalidate(2, msg = $$props.msg);
    		if ("score" in $$props) $$invalidate(3, score = $$props.score);
    		if ("scoreComp" in $$props) $$invalidate(4, scoreComp = $$props.scoreComp);
    		if ("timer" in $$props) $$invalidate(5, timer = $$props.timer);
    		if ("onTimerEnd" in $$props) onTimerEnd = $$props.onTimerEnd;
    		if ("combo" in $$props) $$invalidate(6, combo = $$props.combo);
    		if ("comboTimout" in $$props) comboTimout = $$props.comboTimout;
    		if ("effects" in $$props) $$invalidate(7, effects = $$props.effects);
    		if ("hp" in $$props) hp = $$props.hp;
    		if ("maxHp" in $$props) maxHp = $$props.maxHp;
    		if ("minHit" in $$props) minHit = $$props.minHit;
    		if ("hitWait" in $$props) hitWait = $$props.hitWait;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gameType,
    		state,
    		msg,
    		score,
    		scoreComp,
    		timer,
    		combo,
    		effects,
    		STATE,
    		newGame,
    		timerEnd,
    		testHit,
    		effects_1_binding,
    		score_1_binding,
    		timer_1_binding,
    		click_handler,
    		gameover_gameType_binding
    	];
    }

    class Freestle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Freestle",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Reaction.svelte generated by Svelte v3.23.2 */
    const file$8 = "src\\Reaction.svelte";

    // (160:2) {#if state == STATE.GameOver}
    function create_if_block$3(ctx) {
    	let gameover;
    	let updating_gameType;
    	let current;

    	function gameover_gameType_binding(value) {
    		/*gameover_gameType_binding*/ ctx[15].call(null, value);
    	}

    	let gameover_props = { score: /*score*/ ctx[3] };

    	if (/*gameType*/ ctx[0] !== void 0) {
    		gameover_props.gameType = /*gameType*/ ctx[0];
    	}

    	gameover = new GameOver({ props: gameover_props, $$inline: true });
    	binding_callbacks.push(() => bind(gameover, "gameType", gameover_gameType_binding));
    	gameover.$on("restart", /*newGame*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(gameover.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gameover, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gameover_changes = {};
    			if (dirty & /*score*/ 8) gameover_changes.score = /*score*/ ctx[3];

    			if (!updating_gameType && dirty & /*gameType*/ 1) {
    				updating_gameType = true;
    				gameover_changes.gameType = /*gameType*/ ctx[0];
    				add_flush_callback(() => updating_gameType = false);
    			}

    			gameover.$set(gameover_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameover.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameover.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gameover, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(160:2) {#if state == STATE.GameOver}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div3;
    	let effects_1;
    	let t0;
    	let div0;
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let score_1;
    	let t4;
    	let timer_1;
    	let t5;
    	let div2;
    	let t7;
    	let current;
    	let mounted;
    	let dispose;
    	let effects_1_props = {};
    	effects_1 = new Effects({ props: effects_1_props, $$inline: true });
    	/*effects_1_binding*/ ctx[11](effects_1);
    	let score_1_props = { score: /*score*/ ctx[3] };
    	score_1 = new Score({ props: score_1_props, $$inline: true });
    	/*score_1_binding*/ ctx[12](score_1);
    	let timer_1_props = { gameType: /*gameType*/ ctx[0] };
    	timer_1 = new Timer({ props: timer_1_props, $$inline: true });
    	/*timer_1_binding*/ ctx[13](timer_1);
    	timer_1.$on("end", /*timerEnd*/ ctx[9]);
    	let if_block = /*state*/ ctx[1] == /*STATE*/ ctx[7].GameOver && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			create_component(effects_1.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			t1 = text(/*msg*/ ctx[2]);
    			t2 = space();
    			div1 = element("div");
    			t3 = text("Score:\r\n    ");
    			create_component(score_1.$$.fragment);
    			t4 = space();
    			create_component(timer_1.$$.fragment);
    			t5 = space();
    			div2 = element("div");
    			div2.textContent = "X";
    			t7 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "msg svelte-apdrzf");
    			add_location(div0, file$8, 152, 2, 2820);
    			attr_dev(div1, "class", "score svelte-apdrzf");
    			add_location(div1, file$8, 153, 2, 2852);
    			attr_dev(div2, "class", "backBtn svelte-apdrzf");
    			add_location(div2, file$8, 158, 2, 3002);
    			attr_dev(div3, "class", "game svelte-apdrzf");
    			add_location(div3, file$8, 150, 0, 2744);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			mount_component(effects_1, div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			mount_component(score_1, div1, null);
    			append_dev(div3, t4);
    			mount_component(timer_1, div3, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div3, t7);
    			if (if_block) if_block.m(div3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div2, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(div3, "click", /*testHit*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const effects_1_changes = {};
    			effects_1.$set(effects_1_changes);
    			if (!current || dirty & /*msg*/ 4) set_data_dev(t1, /*msg*/ ctx[2]);
    			const score_1_changes = {};
    			if (dirty & /*score*/ 8) score_1_changes.score = /*score*/ ctx[3];
    			score_1.$set(score_1_changes);
    			const timer_1_changes = {};
    			if (dirty & /*gameType*/ 1) timer_1_changes.gameType = /*gameType*/ ctx[0];
    			timer_1.$set(timer_1_changes);

    			if (/*state*/ ctx[1] == /*STATE*/ ctx[7].GameOver) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*state*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(effects_1.$$.fragment, local);
    			transition_in(score_1.$$.fragment, local);
    			transition_in(timer_1.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(effects_1.$$.fragment, local);
    			transition_out(score_1.$$.fragment, local);
    			transition_out(timer_1.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			/*effects_1_binding*/ ctx[11](null);
    			destroy_component(effects_1);
    			/*score_1_binding*/ ctx[12](null);
    			destroy_component(score_1);
    			/*timer_1_binding*/ ctx[13](null);
    			destroy_component(timer_1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $hitTarget;
    	validate_store(hitTarget, "hitTarget");
    	component_subscribe($$self, hitTarget, $$value => $$invalidate(18, $hitTarget = $$value));
    	const STATE = { GetReady: 0, Playing: 1, GameOver: 2 };
    	let gameType = "reaction";
    	let state = STATE.GameOver;
    	let msg;
    	let score;
    	let scoreComp;
    	let timer;
    	let onTimerEnd;
    	let effects;
    	let minHit = 2;
    	let hitWait = 0;

    	function newGame() {
    		$$invalidate(3, score = 0);
    		window.addEventListener("devicemotion", hit, true);
    		scoreComp.reset();
    		getReady();
    	}

    	function getReady() {
    		$$invalidate(1, state = STATE.GetReady);
    		$$invalidate(2, msg = "Get Ready!!");
    		onTimerEnd = start;
    		timer.setTime(1);
    	}

    	function start() {
    		$$invalidate(1, state = STATE.Playing);
    		$$invalidate(2, msg = "GO!!!");
    		onTimerEnd = gameOver;
    		timer.setTime(120);
    	}

    	function gameOver() {
    		$$invalidate(1, state = STATE.GameOver);
    		window.removeEventListener("devicemotion", hit, true);
    	}

    	function hit(event) {
    		if (hitWait > 0) {
    			hitWait--;
    			return;
    		}

    		let x = event.acceleration.x;
    		let y = event.acceleration.y;
    		let z = event.acceleration.z;
    		let hit = Math.sqrt(x * x + y * y + z * z); //movement vector length

    		if (state == STATE.Playing) {
    			hitWait = 15;
    			if (hit < minHit) return;
    			hit /= $hitTarget; //calibrate
    			let scoreToAdd = hit * 100;
    			$$invalidate(3, score += scoreToAdd);
    			effects.spawnParticles(4, x, y);
    			effects.flash(0.2, "255,255,255");
    		}
    	}

    	function timerEnd() {
    		onTimerEnd();
    	}

    	onMount(() => {
    		newGame();
    	});

    	onDestroy(() => {
    		gameOver();
    	});

    	function testHit() {
    		let event = {
    			acceleration: {
    				x: Math.random() * 10 - 5,
    				y: Math.random() * 10 - 5,
    				z: Math.random() * 10 - 5
    			}
    		};

    		hit(event);
    		hitWait = 0;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Reaction> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Reaction", $$slots, []);

    	function effects_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			effects = $$value;
    			$$invalidate(6, effects);
    		});
    	}

    	function score_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scoreComp = $$value;
    			$$invalidate(4, scoreComp);
    		});
    	}

    	function timer_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			timer = $$value;
    			$$invalidate(5, timer);
    		});
    	}

    	const click_handler = () => pop();

    	function gameover_gameType_binding(value) {
    		gameType = value;
    		$$invalidate(0, gameType);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		pop,
    		Timer,
    		hitTarget,
    		Score,
    		GameOver,
    		Effects,
    		STATE,
    		gameType,
    		state,
    		msg,
    		score,
    		scoreComp,
    		timer,
    		onTimerEnd,
    		effects,
    		minHit,
    		hitWait,
    		newGame,
    		getReady,
    		start,
    		gameOver,
    		hit,
    		timerEnd,
    		testHit,
    		$hitTarget
    	});

    	$$self.$inject_state = $$props => {
    		if ("gameType" in $$props) $$invalidate(0, gameType = $$props.gameType);
    		if ("state" in $$props) $$invalidate(1, state = $$props.state);
    		if ("msg" in $$props) $$invalidate(2, msg = $$props.msg);
    		if ("score" in $$props) $$invalidate(3, score = $$props.score);
    		if ("scoreComp" in $$props) $$invalidate(4, scoreComp = $$props.scoreComp);
    		if ("timer" in $$props) $$invalidate(5, timer = $$props.timer);
    		if ("onTimerEnd" in $$props) onTimerEnd = $$props.onTimerEnd;
    		if ("effects" in $$props) $$invalidate(6, effects = $$props.effects);
    		if ("minHit" in $$props) minHit = $$props.minHit;
    		if ("hitWait" in $$props) hitWait = $$props.hitWait;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gameType,
    		state,
    		msg,
    		score,
    		scoreComp,
    		timer,
    		effects,
    		STATE,
    		newGame,
    		timerEnd,
    		testHit,
    		effects_1_binding,
    		score_1_binding,
    		timer_1_binding,
    		click_handler,
    		gameover_gameType_binding
    	];
    }

    class Reaction extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Reaction",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const routes = {
        '/': Menu,
        '/game': NormalGame,
        '/calibrate': Calibrate,
        '/freestyle': Freestle,
        '/reaction': Reaction,
    };

    /* src\App.svelte generated by Svelte v3.23.2 */
    const file$9 = "src\\App.svelte";

    function create_fragment$a(ctx) {
    	let router;
    	let t;
    	let img;
    	let img_src_value;
    	let current;
    	let mounted;
    	let dispose;
    	router = new Router({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(router.$$.fragment);
    			t = space();
    			img = element("img");
    			attr_dev(img, "class", "fullScreenBtn svelte-d9ka2e");
    			if (img.src !== (img_src_value = "../images/full_screen_icon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "full screen button");
    			add_location(img, file$9, 75, 0, 1516);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(router, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, img, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(img, "click", /*fullScreen*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(router, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(img);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $location;
    	validate_store(location, "location");
    	component_subscribe($$self, location, $$value => $$invalidate(2, $location = $$value));
    	let isFullScreen;

    	onMount(async () => {
    		let page = $location.split("/")[1];

    		if (page) {
    			await replace("/");
    			push("/" + page);
    		}
    	});

    	async function fullScreen() {
    		if (!isFullScreen) {
    			document.body.requestFullscreen();
    			isFullScreen = true;
    		} else {
    			document.exitFullscreen();
    			isFullScreen = false;
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		Router,
    		routes,
    		push,
    		pop,
    		replace,
    		location,
    		isFullScreen,
    		fullScreen,
    		$location
    	});

    	$$self.$inject_state = $$props => {
    		if ("isFullScreen" in $$props) isFullScreen = $$props.isFullScreen;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [fullScreen];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
