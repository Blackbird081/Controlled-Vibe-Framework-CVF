import argparse
from main import run


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", required=True)
    parser.add_argument("--contrast", type=float, required=True)
    parser.add_argument("--font", type=int, required=True)
    parser.add_argument("--touch", type=int, required=True)

    args = parser.parse_args()

    ui_metadata = {
        "contrast_ratio": args.contrast,
        "font_size": args.font,
        "touch_target": args.touch
    }

    result = run(args.domain, ui_metadata)

    print(result)

    if result["status"] == "REJECTED":
        exit(1)


if __name__ == "__main__":
    main()