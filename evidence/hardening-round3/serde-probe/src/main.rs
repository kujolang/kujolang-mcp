fn main() {
    for source in ["9007199254740991.0", "-9007199254740991.0"] {
        let value: serde_json::Value = serde_json::from_str(source).unwrap();
        println!("{} => {}", source, value);
    }
}
