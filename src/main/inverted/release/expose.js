//expose as export for common js or global for browser
if(typeof window === "undefined") {
	exports.AppContext = inverted.AppContext;
} else {
	global.inverted = inverted;
}